// Manual, guarded GitHub-native ruleset reconciliation for jussray/jussray.
// Run only with an independent admin-scoped token and a founder-approved
// snapshot digest. Never executes from a pull_request workflow.
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const REPO = 'jussray/jussray';
const API = 'https://api.github.com/repos/'+REPO+'/rulesets/';
export const REQUIRED_CONTEXTS = Object.freeze([
  'Independent Review Evidence',
  'Review Gate Unit Tests',
  'Juss & Co Site Browser Proof',
  'Repo Reality / exact-head',
]);

const stableRules = rules => rules.map(({type,parameters}) => parameters===undefined
  ? {type} : {type,parameters});
const stableSnapshot = live => ({
  id: live.id, name: live.name, target: live.target, source: live.source,
  enforcement: live.enforcement, conditions: live.conditions,
  bypass_actors: live.bypass_actors, rules: stableRules(live.rules),
});
export function fingerprint(live) {
  return createHash('sha256').update(JSON.stringify(stableSnapshot(live))).digest('hex');
}

export function planNativeRepair(live) {
  if (!live || live.source!==REPO || live.target!=='branch' || live.enforcement!=='active' ||
      !Number.isSafeInteger(live.id) || !live.name || !Array.isArray(live.rules) ||
      !Array.isArray(live.bypass_actors) || !live.conditions?.ref_name?.include?.length)
    throw new Error('Unrecognized or incomplete active repository ruleset');
  const types=live.rules.map(x=>x.type);
  if (new Set(types).size!==types.length) throw new Error('Duplicate rules; refuse ambiguous update');
  for(const needed of ['pull_request','required_status_checks','deletion'])
    if(!types.includes(needed))throw new Error('Missing mandatory existing rule: '+needed);
  // Narrow only the founder-approved, explicitly named protected branches.
  // A global creation rule with zero bypass actors would lock out feature branches.
  // Refuse unknown branch patterns or exclusions rather than silently weakening them.
  const permitted=new Set(['refs/heads/main','refs/heads/Production','refs/heads/releases','refs/heads/Deployed']);
  const scope=live.conditions.ref_name;
  if(!Array.isArray(scope.exclude) || scope.exclude.length!==0 ||
     scope.include.some(ref=>ref!=='~ALL' && !permitted.has(ref)) ||
     !scope.include.includes('refs/heads/main'))
    throw new Error('Unapproved branch scope: only named release branches may remain after narrowing ~ALL');
  const protectedRefs=scope.include.filter(ref=>ref!=='~ALL');
  if(new Set(protectedRefs).size!==protectedRefs.length)
    throw new Error('Duplicate protected branch in ruleset scope');
  const pull=live.rules.find(x=>x.type==='pull_request').parameters;
  if(pull?.required_review_thread_resolution!==true || pull.required_approving_review_count!==1)
    throw new Error('Review gate cannot be altered or relaxed implicitly');
  const checks=live.rules.find(x=>x.type==='required_status_checks').parameters;
  if(!checks || checks.strict_required_status_checks_policy!==true ||
     !Array.isArray(checks.required_status_checks))throw new Error('Strict checks must pre-exist');
  const seen=new Set(checks.required_status_checks.map(x=>x.context));
  if(seen.size!==checks.required_status_checks.length || seen.has(undefined))
    throw new Error('Duplicate or unidentified existing status check');
  const extra=REQUIRED_CONTEXTS.filter(x=>!seen.has(x)).map(context=>({context}));
  const payload={
    name:live.name, target:live.target, enforcement:live.enforcement,
    conditions:{...structuredClone(live.conditions),ref_name:{...structuredClone(scope),include:protectedRefs}},
    bypass_actors:[],
    rules:[
      ...stableRules(live.rules).map(rule=>rule.type==='required_status_checks'
        ? {type:rule.type,parameters:{...rule.parameters,required_status_checks:[...rule.parameters.required_status_checks,...extra]}}
        : rule),
      ...(!types.includes('non_fast_forward') ? [{type:'non_fast_forward'}] : []),
    ],
  };
  const warnings=[];
  if(!types.includes('non_fast_forward'))
    warnings.push('Missing non-fast-forward protection will be enabled');
  if(scope.include.includes('~ALL'))
    warnings.push('Narrowing ~ALL to explicit protected branches; feature branches will no longer inherit this ruleset');
  if(types.includes('creation'))
    warnings.push('Creation of the named protected branches requires a separate authorized process when bypass actors are removed');
  if(live.bypass_actors.length)
    warnings.push('Removing existing bypass actors requires separate explicit approval');
  if(live.rules.some(x=>x.type==='required_deployments'))
    warnings.push('Existing required deployment environments are preserved, including PR preview environments');
  return {id:live.id, existingDigest:fingerprint(live), payload, warnings,
    checkContexts:payload.rules.find(x=>x.type==='required_status_checks').parameters.required_status_checks.map(x=>x.context)};
}

async function jsonRequest(url,method,token,request,body) {
  const res=await request(url,{
    method, headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
      Authorization:'Bearer '+token,'Content-Type':'application/json','User-Agent':'jussco-native-review-repair'},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(15000),
  });
  if(!res.ok)throw new Error('GitHub ruleset '+method+' failed: HTTP '+res.status);
  return res.json();
}

export async function applyNativeRepair({token,rulesetId,expectedDigest,confirmGlobal=false,
  confirmBypassRemoval=false,confirmScopeNarrowing=false,request=fetch}) {
  if(!token || !Number.isSafeInteger(rulesetId) || rulesetId<1 ||
    !/^[0-9a-f]{64}$/.test(expectedDigest||''))throw new Error('Missing admin credential, stable ruleset ID, or snapshot digest');
  const url=API+rulesetId;
  const before=await jsonRequest(url,'GET',token,request);
  if(before.id!==rulesetId)throw new Error('Ruleset ID drift');
  if(fingerprint(before)!==expectedDigest)throw new Error('Provider snapshot digest changed; re-read ruleset before any write');
  const plan=planNativeRepair(before);
  if(before.conditions.ref_name.include.includes('~ALL') && !confirmGlobal)
    throw new Error('Explicit all-branch scope approval required before global ruleset mutation');
  if(before.conditions.ref_name.include.includes('~ALL') && !confirmScopeNarrowing)
    throw new Error('Explicit protected-branch scope narrowing approval required');
  if(before.bypass_actors.length && !confirmBypassRemoval)
    throw new Error('Explicit bypass removal approval required');
  await jsonRequest(url,'PUT',token,request,plan.payload);
  const after=await jsonRequest(url,'GET',token,request);
  if(after.id!==rulesetId || after.enforcement!=='active' ||
     JSON.stringify(after.conditions)!==JSON.stringify(plan.payload.conditions) ||
     after.bypass_actors?.length!==0)throw new Error('Ruleset provider readback mismatch');
  const expected=stableRules(plan.payload.rules),actual=stableRules(after.rules||[]);
  if(JSON.stringify(expected)!==JSON.stringify(actual))
    throw new Error('Ruleset provider readback differs from approved exact update');
  return {verified:true,id:rulesetId,snapshotBefore:expectedDigest,snapshotAfter:fingerprint(after),
    requiredContexts:plan.checkContexts};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  (async()=>{
    const args=process.argv.slice(2);
    const flags=new Set(args.filter(x=>x.startsWith('--')));
    const token=process.env.JUSS_GITHUB_RULESET_ADMIN_TOKEN;
    const id=Number(process.env.JUSS_RULESET_ID);
    if(!token || !Number.isSafeInteger(id) || id<1)
      throw new Error('Set JUSS_GITHUB_RULESET_ADMIN_TOKEN and JUSS_RULESET_ID');
    if(!flags.has('--apply')){
      const live=await jsonRequest(API+id,'GET',token,fetch);
      const plan=planNativeRepair(live);
      console.log(JSON.stringify({rulesetId:plan.id,snapshotDigest:plan.existingDigest,
        contexts:plan.checkContexts,warnings:plan.warnings,mode:'READ_ONLY'},null,2));
      return;
    }
    const expectedDigest=process.env.JUSS_APPROVED_RULESET_DIGEST;
    const result=await applyNativeRepair({token,rulesetId:id,expectedDigest,
      confirmGlobal:flags.has('--approve-all-branches'),
      confirmBypassRemoval:flags.has('--approve-bypass-removal'),
      confirmScopeNarrowing:flags.has('--approve-branch-scope')});
    console.log(JSON.stringify(result,null,2));
  })().catch(e=>{console.error('RULESET REPAIR BLOCKED:',e.message);process.exitCode=1;});
}
