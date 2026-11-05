import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const manifest = JSON.parse(readFileSync(join(SITE, 'data', 'licensable-assets.json'), 'utf8'));
const robots = readFileSync(join(SITE, 'robots.txt'), 'utf8');
const headers = readFileSync(join(SITE, '_headers'), 'utf8');
const llms = readFileSync(join(SITE, 'llms.txt'), 'utf8');
const crawlers = JSON.parse(readFileSync(join(SITE, 'crawlers.json'), 'utf8'));
const catalog = JSON.parse(readFileSync(join(SITE, '.well-known', 'api-catalog'), 'utf8'));

const records = manifest?.dataset?.records || [];
const serialized = JSON.stringify(manifest);
const forbiddenKeys = new Set([
  'email','contact','contacts','carriers','evidence','builder','projectId','appId',
  'preview','token','secret','password','cookie','guardian','customer','userId',
  'messages','privateAnalytics','safetyThresholds','receipt','receipts'
]);

function walk(value, path = '') {
  if (Array.isArray(value)) return value.forEach((v, i) => walk(v, `${path}[${i}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenKeys.has(key), false, `forbidden key ${path ? path + '.' : ''}${key}`);
    walk(child, path ? `${path}.${key}` : key);
  }
}

test('licensable export has stable schema, grain and unique records', () => {
  assert.equal(manifest.schema, 'jussco/licensable-assets@v1');
  assert.equal(manifest.dataset.grain, 'one public Juss & Co product or public-facing system per record');
  assert.ok(records.length >= 5);
  const ids = records.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of records) {
    assert.match(r.id, /^[a-z0-9-]+$/);
    assert.ok(r.name && r.kind && r.status && r.summary && r.provenance);
    assert.match(r.publicUrl, /^https:\/\//);
    assert.ok(r.summary.length <= 280);
  }
});

test('licensable export contains no direct contact, credential or internal-carrier fields', () => {
  walk(manifest.dataset);
  assert.doesNotMatch(JSON.stringify(manifest.dataset), /mailto:|@[a-z0-9.-]+\.[a-z]{2,}/i);
  assert.doesNotMatch(JSON.stringify(records), /private repo|private carrier|projectid|appid|builder preview/i);
});

test('excluded data classes explicitly cover private and child-family data', () => {
  const exclusions = manifest.excludedData.join(' ').toLowerCase();
  for (const phrase of ['private user', 'customer', 'child', 'teen', 'guardian', 'private-message', 'authentication', 'credential', 'private analytics', 'internal prompts']) {
    assert.ok(exclusions.includes(phrase), `missing exclusion: ${phrase}`);
  }
});

test('crawler signals permit search/reference while reserving AI ingestion and training', () => {
  const signal = /Content-Signal:\s*search=yes,\s*ai-input=no,\s*ai-train=no,\s*use=reference/i;
  assert.match(robots, signal);
  assert.match(headers, signal);
  assert.equal(crawlers.policy.searchDiscovery, 'allow');
  assert.equal(crawlers.policy.aiInput, 'commercial_license_required');
  assert.equal(crawlers.policy.modelTraining, 'commercial_license_required');
});

test('discovery surfaces point to the licensing inventory and do not imply a license grant', () => {
  assert.match(llms, /licensable-assets\.json/);
  assert.match(llms, /Public visibility is not a license grant/i);
  assert.match(crawlers.authority, /never grants authentication/i);
  const items = catalog.linkset?.[0]?.item || [];
  assert.ok(items.some((x) => x.href === 'https://www.jussco.company/data/licensable-assets.json'));
  assert.match(manifest.notice, /not itself a license grant/i);
});
