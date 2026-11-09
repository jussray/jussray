import test from 'node:test';
import assert from 'node:assert/strict';
import {founderDecision,getFounderEvidence,reviewDecision,rulesetDecision,getReviewEvidence,getRulesEvidence,runReviewGate} from './verify-independent-review.mjs';

const H='a'.repeat(40),OLD='b'.repeat(40);
const pr=()=>({state:'open',draft:false,user:{login:'jussray'},head:{sha:H},base:{ref:'main'}});
const approval=(login,sha=H,date='2026-10-15T23:00:00Z')=>({
  user:{login,type:'User'},state:'APPROVED',commit_id:sha,submitted_at:date,
});
const decide=(reviews,pull=pr())=>reviewDecision({pull,reviews,expectedHead:H});

test('requires an independent human approval on the exact current head',()=>{
  const result=decide([]);
  assert.equal(result.ok,false);
  assert.equal(result.approvedCount,0);
  assert.match(result.errors.join(';'),/Missing independent human approval on exact head/);
  const reviewed=decide([approval('independent')]);
  assert.equal(reviewed.ok,true);
  assert.equal(reviewed.approvedCount,1);
  assert.equal(reviewed.reviewMode,'independent-human-exact-head');
});
test('self approval is not treated as independent authority',()=>{
  const result=decide([approval('jussray')]);
  assert.equal(result.ok,false);
  assert.equal(result.approvedCount,0);
});
test('bot / app approvals are not independent human reviewers',()=>{
  const bot={...approval('codex[bot]'),user:{login:'codex[bot]',type:'Bot'}};
  assert.equal(decide([bot]).approvedCount,0);
  assert.equal(decide([{...approval('app-account'),user:{login:'app-account',type:'Bot'}}]).approvedCount,0);
});
test('approvals for old commits do not count after a new head',()=>{
  assert.equal(decide([approval('actual-reviewer',OLD)]).ok,false);
  assert.equal(decide([approval('actual-reviewer',OLD)]).approvedCount,0);
  assert.equal(decide([approval('actual-reviewer')],{...pr(),head:{sha:OLD}}).ok,false);
});
test('later requested changes blocks approval, even with another approval',()=>{
  const r=[approval('one'),{...approval('two'),state:'CHANGES_REQUESTED'}];
  assert.equal(decide(r).ok,false);
});
test('review dismissal and later approval are respected',()=>{
  const r=[{...approval('one'),state:'CHANGES_REQUESTED'},
    {...approval('one',H,'2026-10-15T23:05:00Z'),state:'DISMISSED'},
    approval('two')];
  assert.equal(decide(r).ok,true);
});
test('a later withdrawn approval no longer counts',()=>{
  const r=[approval('one'),{...approval('one',H,'2026-10-15T23:05:00Z'),state:'DISMISSED'}];
  assert.equal(decide(r).ok,false);
  assert.equal(decide(r).approvedCount,0);
});
test('commented review does not manufacture an approval',()=>{
  const r=[{...approval('one'),state:'COMMENTED'}];
  assert.equal(decide(r).ok,false);
  assert.equal(decide(r).approvedCount,0);
});
test('draft, closed, wrong base and missing evidence fail closed',()=>{
  for(const p of [{...pr(),draft:true},{...pr(),state:'closed'},{...pr(),base:{ref:'dev'}}])
    assert.equal(decide([approval('one')],p).ok,false);
  assert.equal(reviewDecision({pull:pr(),reviews:null,expectedHead:H}).ok,false);
});
test('pagination collects review evidence and does not omit the 101st reviewer',async()=>{
  const expected=['https://api.github.com/repos/jussray/jussray/pulls/28',
    'https://api.github.com/repos/jussray/jussray/pulls/28/reviews?per_page=100&page=1',
    'https://api.github.com/repos/jussray/jussray/pulls/28/reviews?per_page=100&page=2'];
  const calls=[];
  const fake=async url=>{calls.push(url);return {ok:true,json:async()=>calls.length===1?pr():calls.length===2?Array.from({length:100},(_,i)=>approval('u'+i)): [approval('final')]};};
  const result=await getReviewEvidence({repo:'jussray/jussray',number:28,token:'example',request:fake});
  assert.equal(result.reviews.length,101);assert.deepEqual(calls,expected);
});
test('GitHub API errors and missing token are not treated as empty approvals',async()=>{
  await assert.rejects(()=>getReviewEvidence({repo:'jussray/jussray',number:28,token:'x',request:async()=>({ok:false,status:403})}),/HTTP 403/);
  await assert.rejects(()=>getReviewEvidence({repo:'jussray/jussray',number:28}),/Missing scoped/);
});
const enforcedRule={id:123,target:'branch',enforcement:'active',conditions:{ref_name:{include:['~DEFAULT_BRANCH'],exclude:[]}},
  bypass_actors:[],rules:[
    {type:'pull_request',parameters:{required_approving_review_count:1,dismiss_stale_reviews_on_push:true,require_last_push_approval:true,required_review_thread_resolution:true}},
    {type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:[{context:'Independent Review Evidence'},{context:'Juss & Co Site Browser Proof'},{context:'Repo Reality / exact-head'},{context:'Review Gate Unit Tests'}]}},
    {type:'deletion'},{type:'non_fast_forward'}
  ]};

test('a missing or misconfigured native GitHub ruleset blocks release regardless of reviewer',()=>{
  assert.equal(rulesetDecision([]).ok,false);
  assert.equal(rulesetDecision([{...enforcedRule,enforcement:'evaluate'}]).ok,false);
  assert.equal(rulesetDecision([{...enforcedRule,bypass_actors:[{actor_id:1}]}]).ok,false);
  assert.equal(rulesetDecision([{...enforcedRule,rules:enforcedRule.rules.filter(r=>r.type!=='pull_request')}]).ok,false);
  assert.equal(rulesetDecision([{...enforcedRule,conditions:{ref_name:{include:['refs/heads/feature'],exclude:[]}}}]).ok,false);
  assert.equal(rulesetDecision([enforcedRule]).ok,true);
});
test('native ruleset readback rejects unlisted or denied admin evidence',async()=>{
  const fake=async url=>({ok:true,json:async()=>url.endsWith('includes_parents=true')?[{id:123,enforcement:'active',target:'branch'}]:enforcedRule});
  const data=await getRulesEvidence({repo:'jussray/jussray',token:'fake',request:fake});
  assert.equal(rulesetDecision(data).ok,true);
  await assert.rejects(()=>getRulesEvidence({repo:'jussray/jussray',token:'fake',request:async()=>({ok:false,status:403})}),/HTTP 403/);
});
test('end-to-end systematic review verifies policy but never founder authorization',async()=>{
  const api=async url=>({ok:true,json:async()=>{
    if(url.includes('/rulesets?'))return [{id:123,enforcement:'active',target:'branch'}];
    if(url.endsWith('/rulesets/123'))return enforcedRule;
    if(url.includes('/reviews?'))return [approval('independent')];
    if(url.includes('/timeline?'))return [];
    if(url.includes('/actions/runs?'))return {workflow_runs:[]};
    return pr();
  }});
  const env={GITHUB_REPOSITORY:'jussray/jussray',PR_NUMBER:'28',PR_HEAD_SHA:H,GITHUB_TOKEN:'fake'};
  const result=await runReviewGate(env,api);
  assert.equal(result.nativeRulesetEnforced,true);
  assert.equal(result.releaseAuthorized,false);
  await assert.rejects(()=>runReviewGate({...env,PR_HEAD_SHA:OLD},api),/changed during evaluation|head changed/);
  const noRules=async url=>({ok:true,json:async()=>url.includes('/rulesets?')?[]:url.includes('/reviews?')?[approval('independent')]:url.includes('/timeline?')?[]:url.includes('/actions/runs?')?{workflow_runs:[]}:pr()});
  await assert.rejects(()=>runReviewGate(env,noRules),/No active ruleset/);
});

test('concurrent PR head movement invalidates a previously approved exact-head readback',async()=>{
  let prReads=0;
  const api=async url=>({ok:true,json:async()=>{
    if(url.includes('/rulesets?')) return [{id:123,enforcement:'active',target:'branch'}];
    if(url.endsWith('/rulesets/123')) return enforcedRule;
    if(url.includes('/reviews?')) return [approval('independent')];
    if(url.includes('/timeline?')) return [];
    if(url.includes('/actions/runs?')) return {workflow_runs:[]};
    prReads++;
    return prReads===1?pr():{...pr(),head:{sha:OLD}};
  }});
  const env={GITHUB_REPOSITORY:'jussray/jussray',PR_NUMBER:'28',PR_HEAD_SHA:H,GITHUB_TOKEN:'fake'};
  await assert.rejects(()=>runReviewGate(env,api),/changed during evaluation/);
  assert.equal(prReads,2);
});

test('native approval count 0 is allowed (founder review is enforced by the required check); other counts fail',()=>{
  const withCount=n=>enforcedRule.rules.map(r=>r.type==='pull_request'
    ? {...r,parameters:{...r.parameters,required_approving_review_count:n}}:r);
  assert.equal(rulesetDecision([{...enforcedRule,rules:withCount(0)}]).ok,true);
  assert.equal(rulesetDecision([{...enforcedRule,rules:withCount(2)}]).ok,false);
  assert.equal(rulesetDecision([{...enforcedRule,rules:withCount(undefined)}]).ok,false);
});

test('missing checks and non-strict status configuration block governance',()=>{
  for(const context of ['Independent Review Evidence','Juss & Co Site Browser Proof','Repo Reality / exact-head','Review Gate Unit Tests']){
    const rules=enforcedRule.rules.map(r=>r.type==='required_status_checks'
      ? {...r,parameters:{...r.parameters,required_status_checks:r.parameters.required_status_checks.filter(x=>x.context!==context)}}:r);
    assert.equal(rulesetDecision([{...enforcedRule,rules}]).ok,false,context);
  }
  const lax=enforcedRule.rules.map(r=>r.type==='required_status_checks'
    ? {...r,parameters:{...r.parameters,strict_required_status_checks_policy:false}}:r);
  assert.equal(rulesetDecision([{...enforcedRule,rules:lax}]).ok,false);
});

test('multiple active main rulesets cannot hide an unsupported approval rule',()=>{
  const conflicting={...enforcedRule,id:456,rules:[
    {type:'pull_request',parameters:{required_approving_review_count:3,required_review_thread_resolution:true}}
  ]};
  assert.equal(rulesetDecision([enforcedRule,conflicting]).ok,false);
});

test('missing resolved-conversation requirement is blocked even with required human approval',()=>{
  const rules=enforcedRule.rules.map(r=>r.type==='pull_request'
    ? {...r,parameters:{required_approving_review_count:1,required_review_thread_resolution:false}}:r);
  assert.equal(rulesetDecision([{...enforcedRule,rules}]).ok,false);
});

// Founder review (Juss, 2026-11-09)
const PUSH='2026-11-09T12:00:00Z';
const sig=(kind,at,extra={})=>({kind,login:'jussray',viaApp:null,at,body:'',...extra});
const founder=(signals)=>({signals,headPushedAt:PUSH});
test('founder /approve comment in the GitHub UI on the exact head passes the gate',()=>{
  const r=reviewDecision({pull:pr(),reviews:[],expectedHead:H,founder:founder([sig('comment','2026-11-09T12:05:00Z',{body:'/approve '+H.slice(0,7)})])});
  assert.equal(r.ok,true);
  assert.equal(r.founderReview,'founder-approve-comment');
  assert.equal(r.reviewMode,'founder-review-exact-head');
});
test('founder enabling auto-merge after the head push passes; disabling withdraws it',()=>{
  assert.equal(founderDecision({signals:[sig('auto_merge_enabled','2026-11-09T12:05:00Z')],expectedHead:H,headPushedAt:PUSH}).via,'founder-auto-merge');
  assert.equal(founderDecision({signals:[sig('auto_merge_enabled','2026-11-09T12:05:00Z'),sig('auto_merge_disabled','2026-11-09T12:06:00Z')],expectedHead:H,headPushedAt:PUSH}).ok,false);
});
test('auto-merge or approval given before the head was pushed does not carry to the new head',()=>{
  assert.equal(founderDecision({signals:[sig('auto_merge_enabled','2026-11-09T11:00:00Z')],expectedHead:H,headPushedAt:PUSH}).ok,false);
  assert.equal(founderDecision({signals:[sig('comment','2026-11-09T11:00:00Z',{body:'/approve '+H.slice(0,7)})],expectedHead:H,headPushedAt:PUSH}).ok,false);
});
test('agent or app actions never count as the founder review, even from the founder account',()=>{
  for (const viaApp of ['claude','chatgpt-codex-connector',undefined]) {
    assert.equal(founderDecision({signals:[sig('comment','2026-11-09T12:05:00Z',{viaApp,body:'/approve '+H.slice(0,7)})],expectedHead:H,headPushedAt:PUSH}).ok,false);
    assert.equal(founderDecision({signals:[sig('auto_merge_enabled','2026-11-09T12:05:00Z',{viaApp})],expectedHead:H,headPushedAt:PUSH}).ok,false);
  }
});
test('wrong sha, wrong person, short sha or missing push time fail closed',()=>{
  const at='2026-11-09T12:05:00Z';
  assert.equal(founderDecision({signals:[sig('comment',at,{body:'/approve '+OLD.slice(0,7)})],expectedHead:H,headPushedAt:PUSH}).ok,false);
  assert.equal(founderDecision({signals:[sig('comment',at,{login:'someone',body:'/approve '+H.slice(0,7)})],expectedHead:H,headPushedAt:PUSH}).ok,false);
  assert.equal(founderDecision({signals:[sig('comment',at,{body:'/approve '+H.slice(0,6)})],expectedHead:H,headPushedAt:PUSH}).ok,false);
  assert.equal(founderDecision({signals:[sig('comment',at,{body:'/approve '+H.slice(0,7)})],expectedHead:H,headPushedAt:null}).ok,false);
});
test('requested changes from another reviewer still block a founder review',()=>{
  const r=reviewDecision({pull:pr(),reviews:[{...approval('two'),state:'CHANGES_REQUESTED'}],expectedHead:H,founder:founder([sig('auto_merge_enabled','2026-11-09T12:05:00Z')])});
  assert.equal(r.ok,false);
});
test('timeline reader keeps app attribution and takes the head push time from its first PR run',async()=>{
  const api=async url=>({ok:true,json:async()=>url.includes('/timeline?')?[
    {event:'commented',user:{login:'jussray'},performed_via_github_app:null,created_at:'2026-11-09T12:05:00Z',body:'/approve aaaaaaa'},
    {event:'commented',user:{login:'jussray'},performed_via_github_app:{slug:'claude'},created_at:'2026-11-09T12:06:00Z',body:'/approve aaaaaaa'},
    {event:'auto_merge_enabled',actor:{login:'jussray'},created_at:'2026-11-09T12:07:00Z'},
    {event:'labeled',actor:{login:'jussray'},created_at:'2026-11-09T12:08:00Z'},
  ]:{workflow_runs:[{created_at:'2026-11-09T12:01:00Z'},{created_at:PUSH}]}});
  const e=await getFounderEvidence({repo:'jussray/jussray',number:9,sha:H,token:'t',request:api});
  assert.deepEqual(e.signals.map(x=>[x.kind,x.viaApp]),[['comment',null],['comment','claude'],['auto_merge_enabled',undefined]]);
  assert.equal(e.headPushedAt,'2026-11-09T12:00:00.000Z');
});

test('squash and rebase auto-merge events count as enabling auto-merge (observed on PR #74)',async()=>{
  const api=async url=>({ok:true,json:async()=>url.includes('/timeline?')?[
    {event:'auto_squash_enabled',actor:{login:'jussray'},performed_via_github_app:null,created_at:'2026-11-09T12:05:00Z'},
    {event:'auto_rebase_enabled',actor:{login:'jussray'},performed_via_github_app:null,created_at:'2026-11-09T12:06:00Z'},
  ]:{workflow_runs:[{created_at:PUSH}]}});
  const e=await getFounderEvidence({repo:'jussray/jussray',number:74,sha:H,token:'t',request:api});
  assert.deepEqual(e.signals.map(x=>x.kind),['auto_merge_enabled','auto_merge_enabled']);
  assert.equal(founderDecision({...e,expectedHead:H}).via,'founder-auto-merge');
});
