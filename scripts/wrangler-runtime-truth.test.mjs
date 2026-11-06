// Runtime-truth guard for the jussray Worker config.
// Pins wrangler.jsonc to the reviewed baseline (92952c4): static assets only,
// no Worker script, no KV/analytics bindings. Any change to that surface must
// land as a reviewed PR that updates this guard in the same change.
// Overrides for proving the guard fails on a defective config:
//   WRANGLER_JSONC=<path>  ROOT=<repo root>
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || join(here, '..');
const WRANGLER = process.env.WRANGLER_JSONC || join(ROOT, 'wrangler.jsonc');
const cfg = JSON.parse(readFileSync(WRANGLER, 'utf8'));

const BASELINE_KEYS = ['$schema', 'name', 'compatibility_date', 'preview_urls', 'previews', 'assets', 'routes'];

test('1. top-level keys match the reviewed baseline exactly', () => {
  assert.deepEqual(Object.keys(cfg).sort(), [...BASELINE_KEYS].sort());
});

test('2. no Worker script entrypoint (no main key, no src/index.ts)', () => {
  assert.equal('main' in cfg, false, 'main key switches the deploy to Worker-script mode');
  assert.equal(existsSync(join(ROOT, 'src', 'index.ts')), false, 'src/index.ts must not exist');
});

test('3. static assets only: directory ./site, no assets.binding', () => {
  assert.equal(cfg.assets?.directory, './site');
  assert.equal('binding' in (cfg.assets || {}), false);
});

test('4. routes are exactly the two custom domains', () => {
  const expected = ['jussco.company', 'www.jussco.company'];
  const actual = (cfg.routes || []).map((r) => r.pattern).sort();
  assert.deepEqual(actual, expected);
  assert.ok((cfg.routes || []).every((r) => r.custom_domain === true));
});

test('5. no KV, analytics-engine, or trigger bindings', () => {
  for (const k of ['kv_namespaces', 'analytics_engine_dataset', 'triggers', 'd1_databases']) {
    assert.equal(k in cfg, false, `${k} is not part of the reviewed static-site config`);
  }
});
