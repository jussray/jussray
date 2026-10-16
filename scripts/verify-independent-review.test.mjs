import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewDecision,getReviewEvidence,runReviewGate} from './verify-independent-review.mjs';

const H='a'.repeat(40),OLD='b'.repeat(40);
const pr=()=>({state:'open',draft:false,user:{login:'jussray'},head:{sha:H},base:{ref:'main'}});
const approval=(login,sha=H,date='2026-10-15T23:00:00Z')=>({
  user:{login,type:'User'},state:'APPROVED',commit_id:sha,submitted_at:date,
});
const decide=(reviews,pull=pr())=>reviewDecision({pull,reviews,expectedHead:H});

test('one separate human approval on exact PR head can pass',()=>{
  const result=decide([approval('actual-reviewer')]);
  assert.equal(result.ok,true);assert.equal(result.approvedCount,1);
});
test('a self approval cannot satisfy independent reviewer',()=>{
  assert.equal(decide([approval('jussray')]).ok,false);
});
test('bot / app approvals are not independent human reviewers',()=>{
  const bot={...approval('codex[bot]'),user:{login:'codex[bot]',type:'Bot'}};
  assert.equal(decide([bot]).ok,false);
  assert.equal(decide([{...approval('app-account'),user:{login:'app-account',type:'Bot'}}]).ok,false);
});
test('approvals for old commits do not count after a new head',()=>{
  assert.equal(decide([approval('actual-reviewer',OLD)]).ok,false);
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
});
test('commented review does not manufacture an approval',()=>{
  const r=[{...approval('one'),state:'COMMENTED'}];
  assert.equal(decide(r).ok,false);
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
test('end-to-end gate fetches same PR and verifies current-head approval',async()=>{
  const api=async url=>({ok:true,json:async()=>url.includes('/reviews?')?[approval('independent')]:pr()});
  const env={GITHUB_REPOSITORY:'jussray/jussray',PR_NUMBER:'28',PR_HEAD_SHA:H,GITHUB_TOKEN:'fake'};
  assert.equal((await runReviewGate(env,api)).ok,true);
  await assert.rejects(()=>runReviewGate({...env,PR_HEAD_SHA:OLD},api),/head changed/);
});
