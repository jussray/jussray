import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observePublicSources, servePublicEvidence} from '../workers/public-evidence.mjs';

const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
const sha='a'.repeat(40);
const fixture=async url=>({
  ok:url.includes('/jussray/Sekret-Bip/'),
  status:200,
  async json(){return [{sha,commit:{committer:{date:'2026-11-26T17:00:00Z'}}}];}
});

test('the source feed is allowlisted, anonymous and never declares a product launch',async()=>{
  const payload=await observePublicSources(fixture,new Date('2026-11-26T18:00:00Z'));
  assert.equal(payload.schema,'jussco/public-evidence@v1');
  assert.deepEqual(payload.sources,[{name:"Se'kret Bip",repo:'jussray/Sekret-Bip',sha,committedAt:'2026-11-26T17:00:00Z',kind:'public_source_commit_only'}]);
  assert.equal('live' in payload.sources[0],false);
  assert.equal('customer' in payload.sources[0],false);
  assert.equal('checkout' in payload.sources[0],false);
  assert.equal('readiness' in payload.sources[0],false);
});

test('bad SHA, missing dates and unavailable providers fail closed',async()=>{
  const bad=await observePublicSources(async()=>({ok:true,async json(){return [{sha:'fake',commit:{committer:{date:'not-a-date'}}}];}}));
  assert.deepEqual(bad.sources,[]);
  const unavailable=await observePublicSources(async()=>{throw new Error('offline');});
  assert.deepEqual(unavailable.sources,[]);
});

test('public API is GET-only, scoped to the canonical company hosts and contains no CORS wildcard',async()=>{
  for (const [url,method] of [
    ['https://not-jussco.example/api/public-evidence','GET'],
    ['https://www.jussco.company/api/hidden','GET'],
    ['https://www.jussco.company/api/public-evidence','POST']]){
    const response=await servePublicEvidence(new Request(url,{method}),{fetcher:fixture,cache:null});
    assert.equal(response.status,404);
  }
  const response=await servePublicEvidence(new Request('https://www.jussco.company/api/public-evidence'),{fetcher:fixture,cache:null,now:new Date('2026-11-26T18:00:00Z')});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/application\/json/);
  assert.equal(response.headers.get('access-control-allow-origin'),null);
  assert.equal((await response.json()).sources.length,1);
});

test('newer portfolio identity map and founder declared homepage agree on storefront outcomes',()=>{
  const worlds=JSON.parse(read('site/data/worlds.json')).worlds;
  const portfolio=JSON.parse(read('site/data/portfolio.json')).projects;
  const world=worlds.find(w=>w.name==='Juss Beautiful Hair');
  const project=portfolio.find(p=>p.slug==='juss-beautiful-hair');
  assert.ok(world&&project);
  assert.equal(world.label,'Storefront listed · orders unverified');
  assert.equal(project.publicLabel,world.label);
  assert.doesNotMatch(JSON.stringify({world,project}),/awaiting first order/i);
  const html=read('site/portfolio.html');
  const start=html.indexOf('data-slug="juss-beautiful-hair"');
  assert.ok(start>0);
  const card=html.slice(start,html.indexOf('</article>',start));
  assert.ok(card.includes('Storefront listed · orders unverified'));
});

test('public source observations do not overwrite founder status or runtime claims',()=>{
  const home=read('site/assets/home-world.mjs');
  assert.match(home,/api\/public-evidence/);
  assert.match(home,/public_source_commit_only/);
  assert.match(home,/not a release/i);
  assert.doesNotMatch(home,/w\.st\s*=\s*['"]live/);
  const deployment=JSON.parse(read('wrangler.evidence.jsonc'));
  assert.equal(deployment.name,'jussco-public-evidence');
  assert.ok(deployment.routes.every(r=>r.pattern.includes('/api/public-evidence')));
  assert.ok(!deployment.routes.some(r=>r.custom_domain));
});

test('automatic release holds on stale or red exact-head checks and verifies the public API',()=>{
  const workflow=read('.github/workflows/public-evidence-release.yml');
  assert.ok(workflow.includes('workflow_run.head_sha'));
  assert.ok(workflow.includes('jussco-production'));
  assert.ok(workflow.includes('check-runs?per_page=100'));
  assert.ok(workflow.includes("status')!='completed'"));
  assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'));
  assert.ok(workflow.includes('api/public-evidence'));
  assert.doesNotMatch(workflow,/^  pull_request:/m);
});

test('deep universe cannot display obsolete release, checkout or signup claims',()=>{
  const universe=read('site/universe.html');
  for(const outdated of ['Store open · awaiting first order','API deploy pending, so sign-in is offline','Waiting on redeploy to the latest main','Public signup still gated (#925)'])
    assert.equal(universe.includes(outdated),false,'obsolete claim: '+outdated);
  assert.match(universe,/Registry snapshot/);
  assert.match(universe,/api\/public-evidence/);
});

test('CI validates the canonical Wrangler file without breaking readFileSync arguments',()=>{
  const workflow=read('.github/workflows/site-proof.yml');
  assert.ok(workflow.includes("'wrangler.evidence.jsonc'"));
  assert.ok(workflow.includes("readFileSync('wrangler.jsonc','utf8')"));
  assert.equal(workflow.includes("readFileSync('wrangler.jsonc', 'wrangler.evidence.jsonc'"),false);
});

test('offline Chromium proof supplies deterministic public-evidence endpoint without reaching production',()=>{
  const proof=read('scripts/verify-site.mjs');
  assert.match(proof,/\.route\(['"]\*\*\/api\/public-evidence['"]/);
  assert.match(proof,/jussco\/public-evidence@v1/);
  assert.match(proof,/public_source_commit_only/);
});
