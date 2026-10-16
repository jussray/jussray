// Fail-closed independent-review evidence check.
// Advisory until a GitHub ruleset actually requires a PR + approvals + exact-head checks.
// Runs from trusted main checkout, never from an unreviewed PR branch.
import { pathToFileURL } from 'node:url';

export function reviewDecision({pull, reviews, expectedHead, minApprovals=1}) {
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
  if (approved.length<minApprovals) errors.push('Not enough independent human approvals on current exact head');
  return {ok:errors.length===0,errors,approvedCount:approved.length,exactHead:expectedHead};
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
  const approval=allRules.find(r=>r.type==='pull_request' &&
    r.parameters?.required_approving_review_count>=1 &&
    r.parameters?.dismiss_stale_reviews_on_push===true &&
    r.parameters?.require_last_push_approval===true &&
    r.parameters?.required_review_thread_resolution===true);
  if (!approval) errors.push('Missing enforced independent PR approvals and last-push/stale-thread rules');
  const checks=allRules.filter(r=>r.type==='required_status_checks').flatMap(r=>r.parameters?.required_status_checks||[]);
  const contexts=new Set(checks.map(x=>x.context));
  if (!contexts.has('Independent Review Evidence')) errors.push('Independent Review Evidence is not a required GitHub status check');
  if (!contexts.has('Juss & Co Site Browser Proof')) errors.push('Existing production browser proof is not a required GitHub status check');
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
  const result=reviewDecision({pull:evidence.pull,reviews:evidence.reviews,expectedHead:sha,minApprovals:1});
  const rules=rulesetDecision(await getRulesEvidence({repo,token:env.GITHUB_TOKEN,request}));
  // Guard against concurrent pushes between first PR readback and final witness.
  const latest=await apiGet('https://api.github.com/repos/'+repo+'/pulls/'+number,env.GITHUB_TOKEN,request);
  if (latest?.head?.sha!==sha || latest?.state!=='open' || latest?.draft || latest?.base?.ref!=='main') {
    throw new Error('PR head or review authority changed during evaluation; evidence is stale');
  }
  if (!result.ok || !rules.ok) throw new Error('GitHub merge authority not verified: '+[...result.errors,...rules.errors].join('; '));
  console.log('MERGE AUTHORITY EVIDENCE VERIFIED: active native branch rule plus independent current-head review '+sha.slice(0,12));
  return {...result,nativeRulesetEnforced:true};
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  runReviewGate().catch(error=>{console.error('REVIEW GATE BLOCKED: '+error.message);process.exitCode=1;});
}
