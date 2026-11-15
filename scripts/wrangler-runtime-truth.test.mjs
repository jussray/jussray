// Runtime-truth gate: reviewed public chat endpoint, static assets stay authoritative.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=process.env.ROOT||join(dirname(fileURLToPath(import.meta.url)),'..');
const cfg=JSON.parse(readFileSync(process.env.WRANGLER_JSONC||join(ROOT,'wrangler.jsonc'),'utf8'));
test('configuration permits only the reviewed Worker and bindings',()=>{
  assert.deepEqual(Object.keys(cfg).sort(),['$schema','name','compatibility_date','preview_urls','previews','main','assets','routes','ai','ratelimits'].sort());
  assert.equal(cfg.name,'jussray');
  assert.equal(cfg.main,'./workers/support-chat.mjs');
  assert.equal(existsSync(join(ROOT,'workers/support-chat.mjs')),true);
  assert.equal(existsSync(join(ROOT,'src/index.ts')),false);
});
test('static assets remain authoritative except the single AI route',()=>{
  assert.equal(cfg.assets.directory,'./site');
  assert.equal(cfg.assets.binding,'ASSETS');
  assert.deepEqual(cfg.assets.run_worker_first,['/api/support-chat']);
});
test('domains remain the same two public custom domains',()=>{
  const expected=['jussco.company','www.jussco.company'];
  assert.deepEqual(cfg.routes.map(r=>r.pattern).sort(),expected);
  assert.ok(cfg.routes.every(r=>r.custom_domain===true));
});
test('AI and bounded public rate limit are the only new bindings',()=>{
  assert.deepEqual(cfg.ai,{binding:'AI'});
  assert.deepEqual(cfg.ratelimits,[{name:'SUPPORT_RATE_LIMITER',namespace_id:'91426',simple:{limit:8,period:60}}]);
  for(const k of ['kv_namespaces','analytics_engine_dataset','triggers','d1_databases','services','vars']){
    assert.equal(k in cfg,false,'unexpected runtime binding: '+k);
  }
});
