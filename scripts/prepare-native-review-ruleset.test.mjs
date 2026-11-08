import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_CONTEXTS, fingerprint, planNativeRepair, applyNativeRepair,
} from './prepare-native-review-ruleset.mjs';

const live = () => ({
  id:26428639, name:'Production', target:'branch', source:'jussray/jussray', enforcement:'active',
  conditions:{ref_name:{include:['~ALL','refs/heads/Production','refs/heads/main'],exclude:[]}},
  bypass_actors:[{actor_id:4,actor_type:'RepositoryRole',bypass_mode:'always'}],
  rules:[
    {id:'a',type:'deletion'}, {id:'b',type:'non_fast_forward'},
    {id:'c',type:'required_deployments',parameters:{required_deployment_environments:['github-pages','Think Tank / jussray-pr-68']}},
    {id:'d',type:'required_signatures'},
    {id:'e',type:'pull_request',parameters:{required_approving_review_count:1,required_review_thread_resolution:true,allowed_merge_methods:['merge','squash']}},
    {id:'f',type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,required_status_checks:[]}},
    {id:'g',type:'code_scanning',parameters:{code_scanning_tools:[{tool:'CodeQL',alerts_threshold:'errors'}]}},
    {id:'h',type:'required_linear_history'},
  ],
});
const getRule = (ruleset,type) => ruleset.rules.find(r=>r.type===type);

test('repair adds four systematic checks but preserves all other rules and production deployment gates',()=>{
  const current=live();
  const plan=planNativeRepair(current);
  assert.deepEqual(getRule(plan.payload,'required_status_checks').parameters.required_status_checks.map(c=>c.context),REQUIRED_CONTEXTS);
  assert.deepEqual(getRule(plan.payload,'required_deployments').parameters,getRule(current,'required_deployments').parameters);
  assert.deepEqual(getRule(plan.payload,'code_scanning').parameters,getRule(current,'code_scanning').parameters);
  assert.deepEqual(plan.payload.conditions,current.conditions);
  assert.deepEqual(plan.payload.bypass_actors,[]);
  assert.equal(getRule(plan.payload,'pull_request').parameters.required_approving_review_count,1);
  assert.deepEqual(plan.warnings,['Global ~ALL branch scope: applying affects every included branch','Removing existing bypass actors requires separate explicit approval','Existing required deployment environments are preserved, including PR preview environments']);
  assert.equal(plan.existingDigest,fingerprint(current));
});

test('repair adds missing non-fast-forward protection, without duplication or weakening other rules',()=>{
  const original=live();
  const alreadyProtected=planNativeRepair(original);
  assert.equal(alreadyProtected.payload.rules.filter(r=>r.type==='non_fast_forward').length,1);
  const missing=live();
  missing.rules=missing.rules.filter(r=>r.type!=='non_fast_forward');
  const result=planNativeRepair(missing);
  assert.equal(result.payload.rules.filter(r=>r.type==='non_fast_forward').length,1);
  assert.equal(getRule(result.payload,'pull_request').parameters.required_approving_review_count,1);
  assert.equal(getRule(result.payload,'required_status_checks').parameters.strict_required_status_checks_policy,true);
  assert.ok(result.warnings.includes('Missing non-fast-forward protection will be enabled'));
  assert.equal(result.existingDigest,fingerprint(missing));
});

test('repair preserves existing check contexts without duplicating them',()=>{
  const c=live();
  getRule(c,'required_status_checks').parameters.required_status_checks=[{context:'Repo Reality / exact-head'},{context:'custom-lint',integration_id:12}];
  const updated=getRule(planNativeRepair(c).payload,'required_status_checks').parameters.required_status_checks;
  assert.deepEqual(updated.map(x=>x.context),['Repo Reality / exact-head','custom-lint',...REQUIRED_CONTEXTS.filter(c=>c!=='Repo Reality / exact-head')]);
  assert.deepEqual(updated[1],{context:'custom-lint',integration_id:12});
});

test('rejects wrong repo, disabled ruleset, unresolved conversations and unexpected review count',()=>{
  for(const mutate of [
    x=>{x.source='someone/else'}, x=>{x.enforcement='disabled'},
    x=>{getRule(x,'pull_request').parameters.required_review_thread_resolution=false},
    x=>{getRule(x,'pull_request').parameters.required_approving_review_count=0},
  ]) {const x=live();mutate(x);assert.throws(()=>planNativeRepair(x));}
});

test('apply refuses stale snapshot digest, unapproved all-branch changes or bypass removal',async()=>{
  const liveRule=live();let puts=0;
  const request=async(url,opts)=>{
    if(opts.method==='PUT') {puts++;return {ok:true,json:async()=>liveRule}};
    return {ok:true,json:async()=>liveRule};
  };
  const args={token:'test-secret',rulesetId:26428639,request,expectedDigest:fingerprint(liveRule)};
  await assert.rejects(()=>applyNativeRepair({...args,expectedDigest:'f'.repeat(64),confirmGlobal:true,confirmBypassRemoval:true}),/snapshot digest changed/);
  await assert.rejects(()=>applyNativeRepair({...args,confirmGlobal:false,confirmBypassRemoval:true}),/all-branch/);
  await assert.rejects(()=>applyNativeRepair({...args,confirmGlobal:true,confirmBypassRemoval:false}),/bypass removal/);
  assert.equal(puts,0);
});

test('apply sends one scoped PUT only after approvals, then verifies exact provider readback',async()=>{
  let remote=live();const observed=[];
  const request=async(url,opts)=>{
    observed.push([url,opts.method]);
    if(opts.method==='PUT') {remote={...remote,...JSON.parse(opts.body),rules:JSON.parse(opts.body).rules};return {ok:true,json:async()=>remote};}
    return {ok:true,json:async()=>remote};
  };
  const result=await applyNativeRepair({token:'test',rulesetId:26428639,request,expectedDigest:fingerprint(remote),confirmGlobal:true,confirmBypassRemoval:true});
  assert.equal(result.verified,true);
  assert.deepEqual(observed.map(x=>x[1]),['GET','PUT','GET']);
  assert.deepEqual(remote.bypass_actors,[]);
  assert.deepEqual(getRule(remote,'required_deployments').parameters.required_deployment_environments,['github-pages','Think Tank / jussray-pr-68']);
});

test('403 and rejected post-write readback fail closed; no success claim',async()=>{
  await assert.rejects(()=>applyNativeRepair({token:'test',rulesetId:26428639,expectedDigest:fingerprint(live()),confirmGlobal:true,confirmBypassRemoval:true,request:async()=>({ok:false,status:403})}),/HTTP 403/);
  const request=async(_url,opts)=>({ok:true,json:async()=>opts.method==='PUT'?{...live(),bypass_actors:[]}:live()});
  await assert.rejects(()=>applyNativeRepair({token:'test',rulesetId:26428639,expectedDigest:fingerprint(live()),confirmGlobal:true,confirmBypassRemoval:true,request}),/readback/);
});
