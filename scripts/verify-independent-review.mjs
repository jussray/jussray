// Fail-closed independent-review evidence check.
// Advisory until an active native ruleset requires PRs and strict systematic checks.
// Runs from trusted main checkout, never from an unreviewed PR branch.
import { pathToFileURL } from 'node:url';

// Founder review (Juss, 2026-11-09): Juss is the independent reviewer. GitHub forbids a PR
// author approving his own PR, and every PR here is opened from his account, so his signal is
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

export function rulesetDecision(rulesets) {
  const errors=[];
  if (!Array.isArray(rulesets)) return {ok:false,errors:['Missing repository ruleset evidence']};
  const protectsMain=r=>r?.enforcement==='active' && r?.target==='branch' &&
    (r?.conditions?.ref_name?.include||[]).some(n=>n==='~DEFAULT_BRANCH'||n==='~ALL'||n==='refs/heads/main') &&
    !(r?.conditions?.ref_name?.exclude||[]).some(n=>n==='~DEFAULT_BRANCH'||n==='~ALL'||n==='refs/heads/main');
  const active=rulesets.filter(protectsMain);
  if (!active.length) errors.push('No active ruleset actually protects main');
  if (active.some(r=>Array.isArray(r.bypass_actors) && r.bypass_actors.length>0))
    errors.push('Main ruleset has configured bypass actors requiring authority review');
  const allRules=active.flatMap(r=>r.rules||[]);
  const prRules=allRules.filter(r=>r.type==='pull_request');
  if (!prRules.length || !prRules.some(r=>r.parameters?.required_review_thread_resolution===true))
    errors.push('Missing protected PR rule with resolved review threads');
  // Native approvals may be 0: the author cannot approve his own PR, so the founder review is
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
    if (!response.ok) throw new Error('GitHub review evidence read failed: HTTP '+response.status);
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

// Timeline events keep performed_via_github_app (null for the GitHub UI). A missing key is treated as unknown, never as human.
export async function getFounderEvidence({repo,number,sha,token,request=fetch}){
  const root='https://api.github.com/repos/'+repo;
  const signals=[];
  for(let page=1;page<=10;page++){
    const batch=await apiGet(root+'/issues/'+number+'/timeline?per_page=100&page='+page,token,request);
    if (!Array.isArray(batch)) throw new Error('Timeline API returned non-list result');
    for (const e of batch) {
      // GitHub names the enable event by merge method: auto_merge_enabled, auto_squash_enabled, auto_rebase_enabled.
      const kind=e?.event==='commented'?'comment':/^auto_(merge|squash|rebase)_enabled$/.test(e?.event||'')?'auto_merge_enabled':e?.event;
      if (!['comment','auto_merge_enabled','auto_merge_disabled'].includes(kind)) continue;
      signals.push({kind,login:(e.user||e.actor)?.login,viaApp:'performed_via_github_app' in e ? (e.performed_via_github_app?.slug ?? null) : undefined,
        at:e.created_at,body:kind==='comment'?e.body:''});
    }
    if (batch.length<100) {
      const runs=await apiGet(root+'/actions/runs?event=pull_request&head_sha='+sha+'&per_page=100',token,request);
      const times=(runs?.workflow_runs||[]).map(r=>Date.parse(r.created_at)).filter(Number.isFinite);
      return {signals,headPushedAt:times.length?new Date(Math.min(...times)).toISOString():null};
    }
  }
  throw new Error('Timeline pagination exceeded safe limit; refusing incomplete evidence');
}

export async function getRulesEvidence({repo,token,request=fetch}) {
  const base='https://api.github.com/repos/'+repo+'/rulesets';
  const list=await apiGet(base+'?includes_parents=true',token,request);
  if (!Array.isArray(list)) throw new Error('GitHub returned incomplete ruleset inventory');
  const details=[];
  for (const item of list) {
    if (item?.enforcement==='active' && item?.target==='branch') {
      if (!Number.isInteger(item.id)) throw new Error('Ruleset missing stable ID');
      details.push(await apiGet(base+'/'+item.id,token,request));
    }
  }
  return details;
}

export async function runReviewGate(env=process.env,request=fetch){
  const repo=env.GITHUB_REPOSITORY;
  const number=Number(env.PR_NUMBER);
  const sha=env.PR_HEAD_SHA;
  if (repo!=='jussray/jussray' || !env.GITHUB_TOKEN || !Number.isSafeInteger(number)||number<1)
    throw new Error('Missing authorized repository, PR number or read token');
  const evidence=await getReviewEvidence({repo,number,token:env.GITHUB_TOKEN,request});
  const founder=await getFounderEvidence({repo,number,sha,token:env.GITHUB_TOKEN,request});
  const result=reviewDecision({pull:evidence.pull,reviews:evidence.reviews,expectedHead:sha,founder});
  const rules=rulesetDecision(await getRulesEvidence({repo,token:env.GITHUB_TOKEN,request}));
  // Guard against concurrent pushes between first PR readback and final witness.
  const latest=await apiGet('https://api.github.com/repos/'+repo+'/pulls/'+number,env.GITHUB_TOKEN,request);
  if (latest?.head?.sha!==sha || latest?.state!=='open' || latest?.draft || latest?.base?.ref!=='main') {
    throw new Error('PR head or review authority changed during evaluation; evidence is stale');
  }
  if (!result.ok || !rules.ok) throw new Error('GitHub merge authority not verified: '+[...result.errors,...rules.errors].join('; '));
  console.log('SYSTEMATIC REVIEW POLICY READBACK VERIFIED: '+sha.slice(0,12)+' via '+result.reviewMode+(result.founderReview?' ('+result.founderReview+')':''));
  return {...result,nativeRulesetEnforced:true,releaseAuthorized:false};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  runReviewGate().catch(error=>{console.error('REVIEW GATE BLOCKED: '+error.message);process.exitCode=1;});
}
