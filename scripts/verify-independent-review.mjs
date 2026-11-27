// Fail-closed independent-review evidence check.
// Advisory until an active native ruleset requires PRs and strict systematic checks.
// Runs from trusted main checkout, never from an unreviewed PR branch.
import { pathToFileURL } from 'node:url';

// Founder review (Juss, 2026-11-09): Juss is the independent reviewer. GitHub forbids a PR
// author approving her own PR, and every PR here is opened from her account, so her signal is
// read from actions only a person in the GitHub UI can make on the exact head:
//   - a PR comment "/approve <head sha, 7+ chars>", or
//   - enabling auto-merge after the head was pushed (disabling it later withdraws that).
// Actions made through an app (Claude, Codex, bots) carry performed_via_github_app and never count.
export const FOUNDER='jussray';
const APPROVE=/^\s*\/approve\s+([0-9a-f]{7,40})\b/i;
export function founderDecision({signals, expectedHead, headPushedAt, owner=FOUNDER}) {
  const pushed=Date.parse(headPushedAt||'');
  if (!Array.isArray(signals) || !Number.isFinite(pushed)) return {ok:false,via:null,reason:'Missing founder review evidence or head push time'};
  const human=signals.filter(x=>String(x?.login||'').toLowerCase()===owner && x?.viaApp===null && Number.isFinite(Date.parse(x?.at||'')))
    .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  const comment=human.find(x=>x.kind==='comment' && Date.parse(x.at)>=pushed && (()=>{const m=APPROVE.exec(String(x.body||''));return m && expectedHead.startsWith(m[1].toLowerCase());})());
  if (comment) return {ok:true,via:'founder-approve-comment',at:comment.at};
  let auto=null;
  for (const x of human) {
    if (x.kind==='auto_merge_enabled') auto=Date.parse(x.at)>=pushed ? x : null;
    if (x.kind==='auto_merge_disabled') auto=null;
  }
  if (auto) return {ok:true,via:'founder-auto-merge',at:auto.at};
  return {ok:false,via:null,reason:'Missing founder review on exact head (comment /approve '+expectedHead.slice(0,7)+' or enable auto-merge in GitHub)'};
}

export function reviewDecision({pull, reviews, expectedHead, founder}) {
  const errors=[];
  if (!/^[0-9a-f]{40}$/.test(expectedHead || '')) errors.push('Missing exact expected head SHA');
  if (pull?.state !== 'open' || pull?.draft) errors.push('PR must be open and ready for review');
  if (pull?.base?.ref !== 'main') errors.push('PR must target main');
  if (pull?.head?.sha !== expectedHead) errors.push('PR head changed; old proof is stale');
  const author=pull?.user?.login?.toLowerCase();
  if (!author) errors.push('Missing PR author');
  if (!Array.isArray(reviews)) errors.push('Missing review evidence');
  const decisive=new Map();
  for (const r of Array.isArray(reviews) ? reviews : []) {
    const state=String(r?.state||'').toUpperCase();
    if (!['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(state)) continue;
    const user=r?.user;
    const name=String(user?.login||'').toLowerCase();
    if (!name || name===author || user?.type!=='User' || name.endsWith('[bot]')) continue;
    if (!r?.submitted_at) continue;
    const prior=decisive.get(name);
    const when=Date.parse(r.submitted_at);
    if (!Number.isFinite(when)) continue;
    if (!prior || when>=prior.when) decisive.set(name,{state,sha:r.commit_id,when});
  }
  const blocked=[...decisive.values()].some(r=>r.state==='CHANGES_REQUESTED');
  if (blocked) errors.push('An independent reviewer has unresolved requested changes');
  const approved=[...decisive.entries()].filter(([_,r])=>r.state==='APPROVED' && r.sha===expectedHead).map(([name])=>name);
  // Systematic review and repair happen first; one independent human approval remains the final review gate.
  const fd=founder ? founderDecision({...founder,expectedHead:expectedHead||''}) : {ok:false};
  if (approved.length<1 && !fd.ok) errors.push('Missing independent human approval on exact head'+(fd.reason?': '+fd.reason:''));
  return {ok:errors.length===0,errors,approvedCount:approved.length,founderReview:fd.ok?fd.via:null,exactHead:expectedHead,
    reviewMode:fd.ok&&approved.length<1?'founder-review-exact-head':'independent-human-exact-head'};
}

// Trust pin: change only after authenticated provider evidence ties the numeric App ID to FCR.
export const FCR_BYPASS_APP_ID = null;
export const FOUNDER_BYPASS_USER_ID = 286642846;

export function authorityLayerValid(r, fcrAppId) {
  if (!Number.isSafeInteger(fcrAppId) || fcrAppId <= 0 || r.name !== 'Main Authority Contract') return false;
  const ref = r.conditions?.ref_name;
  if (!Array.isArray(ref?.include) || ref.include.length !== 1 || ref.include[0] !== '~DEFAULT_BRANCH' || !Array.isArray(ref.exclude) || ref.exclude.length !== 0) return false;
  if (!Array.isArray(r.bypass_actors) || r.bypass_actors.length !== 2 || !Array.isArray(r.rules) || r.rules.length !== 1) return false;
  const keys = new Set(r.bypass_actors.map(a => a.actor_type + ':' + a.actor_id + ':' + a.bypass_mode));
  if (!keys.has('User:' + FOUNDER_BYPASS_USER_ID + ':pull_request') || !keys.has('Integration:' + fcrAppId + ':pull_request')) return false;
  const rule = r.rules[0], p = rule.parameters;
  return rule.type === 'pull_request' && p?.required_approving_review_count === 0 && p?.require_code_owner_review === false && p?.require_last_push_approval === false && p?.dismiss_stale_reviews_on_push === true && p?.required_review_thread_resolution === true && Array.isArray(p.allowed_merge_methods) && p.allowed_merge_methods.length === 1 && p.allowed_merge_methods[0] === 'squash';
}

export function rulesetDecision(rulesets, {fcrAppId=FCR_BYPASS_APP_ID}={}) {
  const errors=[];
  if (!Array.isArray(rulesets)) return {ok:false,errors:['Missing repository ruleset evidence']};
  const protectsMain=r=>r?.enforcement==='active' && r?.target==='branch' &&
    (r?.conditions?.ref_name?.include||[]).some(n=>n==='~DEFAULT_BRANCH'||n==='~ALL'||n==='refs/heads/main') &&
    !(r?.conditions?.ref_name?.exclude||[]).some(n=>n==='~DEFAULT_BRANCH'||n==='~ALL'||n==='refs/heads/main');
  const active=rulesets.filter(protectsMain);
  if (!active.length) errors.push('No active ruleset actually protects main');
  if (active.some(r=>!Array.isArray(r.bypass_actors))) errors.push('Missing bypass actor readback');
  const delegated = active.filter(r=>Array.isArray(r.bypass_actors) && r.bypass_actors.length>0);
  if (delegated.length>1 || delegated.some(r=>!authorityLayerValid(r,fcrAppId)))
    errors.push('Main ruleset has unverified or overbroad bypass actors requiring authority review');
  // Mandatory protections must be effective even for the delegated actors.
  const security=active.filter(r=>Array.isArray(r.bypass_actors) && r.bypass_actors.length===0);
  const allRules=security.flatMap(r=>r.rules||[]);
  if (delegated.length) {
    const pr=allRules.filter(r=>r.type==='pull_request');
    if (!pr.some(r=>r.parameters?.required_approving_review_count===0 && r.parameters?.require_code_owner_review===false && r.parameters?.require_last_push_approval===false && r.parameters?.dismiss_stale_reviews_on_push===true && r.parameters?.required_review_thread_resolution===true) || pr.some(r=>r.parameters?.required_approving_review_count!==0 || r.parameters?.require_code_owner_review!==false || r.parameters?.require_last_push_approval!==false))
      errors.push('Delegated authority needs an independent non-bypassable founder PR rule');
    const strict=allRules.filter(r=>r.type==='required_status_checks' && r.parameters?.strict_required_status_checks_policy===true).flatMap(r=>r.parameters.required_status_checks||[]);
    for(const context of ['Independent Review Evidence','Review Gate Unit Tests','Juss & Co Site Browser Proof','Repo Reality / exact-head'])
      if(!strict.some(c=>c.context===context && c.integration_id===15368)) errors.push('Non-bypassable strict GitHub Actions check missing: '+context);
  }
  const prRules=allRules.filter(r=>r.type==='pull_request');
  if (!prRules.length || !prRules.some(r=>r.parameters?.required_review_thread_resolution===true))
    errors.push('Missing protected PR rule with resolved review threads');
  // Native approvals may be 0: the author cannot approve her own PR, so the founder review is
  // enforced by the required Independent Review Evidence check instead.
  if (prRules.some(r=>![0,1].includes(r.parameters?.required_approving_review_count)))
    errors.push('Main ruleset approval count must be 0 or 1');
  const checkRules=allRules.filter(r=>r.type==='required_status_checks');
  if (!checkRules.some(r=>r.parameters?.strict_required_status_checks_policy===true))
    errors.push('Required checks are not strict against current base');
  const checks=checkRules.flatMap(r=>r.parameters?.required_status_checks||[]);
  const contexts=new Set(checks.map(x=>x.context));
  for (const required of ['Independent Review Evidence','Review Gate Unit Tests','Juss & Co Site Browser Proof','Repo Reality / exact-head'])
    if (!contexts.has(required)) errors.push('Missing required systematic review check: '+required);
  if (!allRules.some(r=>r.type==='non_fast_forward') || !allRules.some(r=>r.type==='deletion'))
    errors.push('Main ruleset does not prevent force pushes and deletion');
  return {ok:errors.length===0,errors};
}

async function apiGet(url,token,request=fetch){
  const abort=new AbortController();
  const timer=setTimeout(()=>abort.abort(),15_000);
  try {
    const response=await request(url,{
      headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'jussco-review-evidence'},
      signal:abort.signal,
    });
    if (!response.ok) {
      const error=new Error('GitHub review evidence read failed: HTTP '+response.status);
      error.status=response.status;
      throw error;
    }
    return await response.json();
  } finally {clearTimeout(timer);}
}

export async function getReviewEvidence({repo,number,token,request=fetch}){
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||'') || !Number.isSafeInteger(number)||number<1||!token)
    throw new Error('Missing scoped GitHub PR identity/read token');
  const base='https://api.github.com/repos/'+repo+'/pulls/'+number;
  const pull=await apiGet(base,token,request);
  const reviews=[];
  for(let page=1;page<=10;page++){
    const batch=await apiGet(base+'/reviews?per_page=100&page='+page,token,request);
    if (!Array.isArray(batch)) throw new Error('Review API returned non-list result');
    reviews.push(...batch);
    if(batch.length<100)return {pull,reviews};
  }
  throw new Error('Review pagination exceeded safe limit; refusing incomplete evidence');
}

// Preserve unknown GitHub timeline events in evidence diagnostics, never as human authority.
export function normalizeReviewEvent(event) {
  if (typeof event!=='string') return null;
  const key=event.trim().toLowerCase();
  if (key==='commented') return 'comment';
  const match=/^auto_(?:merge|squash|rebase)_(enabled|disabled)$/.exec(key);
  return match?'auto_merge_'+match[1]:null;
}

// Timeline events keep performed_via_github_app (null for the GitHub UI). A missing key is treated as unknown, never as human.
export async function getFounderEvidence({repo,number,sha,token,request=fetch}){
  const root='https://api.github.com/repos/'+repo;
  const signals=[];
  const unknownEvents=new Set();
  for(let page=1;page<=10;page++){
    const batch=await apiGet(root+'/issues/'+number+'/timeline?per_page=100&page='+page,token,request);
    if (!Array.isArray(batch)) throw new Error('Timeline API returned non-list result');
    for (const e of batch) {
      const kind=normalizeReviewEvent(e?.event);
      if (!kind) {
        unknownEvents.add(typeof e?.event==='string'?e.event:'<missing>');
        continue;
      }
      signals.push({kind,login:(e.user||e.actor)?.login,viaApp:'performed_via_github_app' in e ? (e.performed_via_github_app?.slug ?? null) : undefined,
        at:e.created_at,body:kind==='comment'?e.body:''});
    }
    if (batch.length<100) {
      const runs=await apiGet(root+'/actions/runs?event=pull_request&head_sha='+sha+'&per_page=100',token,request);
      const times=(runs?.workflow_runs||[]).map(r=>Date.parse(r.created_at)).filter(Number.isFinite);
      return {signals,unknownEvents:[...unknownEvents].sort(),headPushedAt:times.length?new Date(Math.min(...times)).toISOString():null};
    }
  }
  throw new Error('Timeline pagination exceeded safe limit; refusing incomplete evidence');
}

export const RULESET_PAGE_SIZE=100;
export const RULESET_MAX_PAGES=100;

// Rulesets can be owned by repositories, organizations or enterprises. Their detail
// URL must follow ownership; a repo-owned URL cannot fetch inherited parent rules.
function rulesetDetailUrl(item,repoBase) {
  if (!Number.isInteger(item?.id)) throw new Error('Ruleset missing stable ID');
  const owner=String(item.source||'');
  if (item.source_type==='Organization'||item.source_type==='Enterprise') {
    if (!/^[A-Za-z0-9_.-]+$/.test(owner)) throw new Error('Unverifiable inherited ruleset owner for '+item.id);
    const scope=item.source_type==='Organization'?'orgs':'enterprises';
    return 'https://api.github.com/'+scope+'/'+owner+'/rulesets/'+item.id;
  }
  if (item.source_type && item.source_type!=='Repository') throw new Error('Unknown ruleset owner type: '+item.source_type);
  return repoBase+'/'+item.id;
}

async function listRulesetInventory(base,token,request) {
  const inventory=new Map();
  for(let page=1;page<=RULESET_MAX_PAGES;page++){
    const batch=await apiGet(base+'?includes_parents=true&per_page='+RULESET_PAGE_SIZE+'&page='+page,token,request);
    if (!Array.isArray(batch)) throw new Error('GitHub returned incomplete ruleset inventory');
    for (const item of batch) {
      if (!Number.isInteger(item?.id)) throw new Error('Ruleset missing stable ID');
      const prior=inventory.get(item.id);
      if (prior && (prior.source_type!==item.source_type||prior.source!==item.source))
        throw new Error('Ruleset ownership changed during inventory collection: '+item.id);
      inventory.set(item.id,item);
    }
    if (batch.length<RULESET_PAGE_SIZE) return [...inventory.values()];
  }
  throw new Error('Ruleset inventory pagination exceeded safe limit');
}

export async function getRulesEvidence({repo,token,request=fetch}) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo||'') || !token)
    throw new Error('Missing base repository or scoped read token');
  const base='https://api.github.com/repos/'+repo+'/rulesets';
  const inventory=await listRulesetInventory(base,token,request);
  const details=[];
  for (const item of inventory) {
    if (item?.enforcement!=='active'||item?.target!=='branch') continue;
    const url=rulesetDetailUrl(item,base);
    let detail;
    try {
      detail=await apiGet(url,token,request);
    } catch (error) {
      if (error.status===404 && (item.source_type==='Organization'||item.source_type==='Enterprise')) {
        // Only tolerate a vanished inherited rule after a fresh COMPLETE inventory
        // proves it is gone. Never silently omit a still-active protection.
        const fresh=await listRulesetInventory(base,token,request);
        if (!fresh.some(x=>x.id===item.id)) continue;
        throw new Error('Inherited ruleset detail still unavailable after readback (HTTP 404): '+item.id);
      }
      throw error;
    }
    if (detail?.id!==item.id||!Array.isArray(detail?.rules)||
        detail.target!=='branch'||detail.enforcement!=='active')
      throw new Error('Incomplete ruleset evidence: '+item.id);
    details.push(detail);
  }
  return details;
}

export function assertReviewGates(review, governance) {
  if (review.ok && governance.ok) return;
  const describe=(label, gate)=>label+'='+ (gate.ok ? 'PASS' : 'FAIL: '+gate.errors.join('; '));
  throw new Error('GitHub merge authority not verified: '+describe('FOUNDER_REVIEW',review)+'; '+describe('NATIVE_GOVERNANCE',governance));
}

export async function runReviewGate(env=process.env,request=fetch){
  const repo=env.GITHUB_REPOSITORY;
  const number=Number(env.PR_NUMBER);
  const sha=env.PR_HEAD_SHA;
  if (repo!=='jussray/jussray' || !env.GITHUB_TOKEN || !Number.isSafeInteger(number)||number<1)
    throw new Error('Missing authorized repository, PR number or read token');
  const evidence=await getReviewEvidence({repo,number,token:env.GITHUB_TOKEN,request});
  if (evidence.pull?.base?.repo?.full_name && evidence.pull.base.repo.full_name!==repo)
    throw new Error('PR base repository differs from authorized target repository');
  const founder=await getFounderEvidence({repo,number,sha,token:env.GITHUB_TOKEN,request});
  const result=reviewDecision({pull:evidence.pull,reviews:evidence.reviews,expectedHead:sha,founder});
  const rules=rulesetDecision(await getRulesEvidence({repo,token:env.GITHUB_TOKEN,request}));
  // Guard against concurrent pushes between first PR readback and final witness.
  const latest=await apiGet('https://api.github.com/repos/'+repo+'/pulls/'+number,env.GITHUB_TOKEN,request);
  if (latest?.head?.sha!==sha || latest?.state!=='open' || latest?.base?.ref!=='main' || (latest?.base?.repo?.full_name && latest.base.repo.full_name!==repo)) {
    throw new Error('PR head or review authority changed during evaluation; evidence is stale');
  }
  if (latest?.draft!==false) throw new Error('GitHub merge authority not verified: PR must be open and ready for review');
  assertReviewGates(result,rules);
  console.log('SYSTEMATIC REVIEW POLICY READBACK VERIFIED: '+sha.slice(0,12)+' via '+result.reviewMode+(result.founderReview?' ('+result.founderReview+')':''));
  return {...result,nativeRulesetEnforced:true,releaseAuthorized:false};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  runReviewGate().catch(error=>{console.error('REVIEW GATE BLOCKED: '+error.message);process.exitCode=1;});
}
