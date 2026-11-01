import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(readFileSync(join(ROOT, 'config', 'cloudflare-monetization-gate.json'), 'utf8'));
const wrangler = JSON.parse(readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8'));

test('JussCo max-priced x402 offer stays within documented token precision and cap', () => {
  assert.equal(plan.schema, 'jussco/cloudflare-monetization-gate@v1');
  assert.equal(plan.gateway.proposedScheme, 'exact');
  assert.equal(plan.gateway.proposedPriceUSD, '100.00');
  assert.equal(plan.gateway.proposedPriceAtomicUnits, '100000000');
  assert.equal(BigInt(plan.gateway.proposedPriceAtomicUnits), BigInt(plan.gateway.proposedPriceUSD.replace('.', '').padEnd(8, '0')) / 100n);
  assert.equal(wrangler.name, 'jussray');
  assert.equal(wrangler.assets.directory, './site');
});

test('payment activation fails closed until resources, wallet, eligibility and JWT validation are independently proved', () => {
  assert.equal(plan.status, 'HELD_NOT_LIVE');
  assert.equal(plan.gateway.enabled, false);
  assert.deepEqual(plan.gateway.candidateRules, []);
  assert.deepEqual(plan.gateway.premiumResourceUrls, []);
  assert.equal(plan.gateway.receivingWallet, null);
  for (const status of Object.values(plan.gateway.releaseGates)) {
    assert.notEqual(status, 'VERIFIED', 'Do not claim gate verification without a receipt');
  }
});

test('public discovery and site navigation must never become payable routes', () => {
  const required = [
    '/', '/index.html', '/licensing.html', '/robots.txt', '/sitemap.xml',
    '/llms.txt', '/crawlers.json', '/data/licensable-assets.json',
    '/.well-known/api-catalog'
  ];
  for (const path of required) {
    assert.ok(plan.publicNeverCharge.includes(path), `missing free path: ${path}`);
  }
  assert.equal(new Set(plan.publicNeverCharge).size, plan.publicNeverCharge.length);
});

test('Pay Per Crawl and enterprise training remain separate, unactivated sales paths', () => {
  assert.equal(plan.payPerCrawl.enabled, false);
  assert.equal(plan.payPerCrawl.selectedCrawlerActions.length, 0);
  assert.equal(plan.payPerCrawl.priceUSD, null);
  assert.equal(plan.enterpriseTraining.testMonthlyPriceUSD, '1500.00');
  assert.equal(plan.enterpriseTraining.checkoutEnabled, false);
  assert.equal(plan.enterpriseTraining.signedLicenseRequired, true);
  assert.equal(plan.enterpriseTraining.privateDataIncluded, false);
});
