import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sourceWorkflow = readFileSync('.github/workflows/site-proof.yml', 'utf8');
const providerWorkflow = readFileSync('.github/workflows/provider-site-proof.yml', 'utf8');
const sourceProof = readFileSync('scripts/verify-site.mjs', 'utf8');
const providerProof = readFileSync('scripts/verify-provider-site.mjs', 'utf8');

test('generic site proof stays deterministic and exact-source only', () => {
  assert.doesNotMatch(sourceWorkflow, /Verify public custom domains in Chromium/);
  assert.doesNotMatch(sourceWorkflow, /Verify deployed portfolio in real browsers/);
  assert.doesNotMatch(sourceWorkflow, /Enforce all browser proof outcomes/);
  // Source proof may inspect an external destination URL as inert link text,
  // but must never navigate/fetch that production origin during local checks.
  assert.match(sourceProof, /page\.goto\(url \+ 'games\/index\.html'/);
  assert.doesNotMatch(sourceProof, /(?:\.goto|\.get|\.post|fetch)\(\s*['`"]https:\/\/games\.jussco\.company\//);
  assert.doesNotMatch(sourceProof, /games production:/i);
});

test('dedicated provider proof remains fail-closed production authority', () => {
  assert.match(providerWorkflow, /CLOUDFLARE_BROWSER_RENDERING_TOKEN/);
  assert.match(providerWorkflow, /Verify public production via Cloudflare Browser Rendering/);
  assert.match(providerWorkflow, /node scripts\/verify-provider-site\.mjs/);
  assert.match(providerProof, /const HOSTS = \['jussco\.company', 'www\.jussco\.company'\]/);
  assert.match(providerProof, /https:\/\/games\.jussco\.company\//);
  assert.match(providerProof, /Missing scoped Cloudflare Browser Rendering token or account ID/);
});

test('required site proof runs on every PR and keeps publication lock enabled', () => {
  const pr = sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'), sourceWorkflow.indexOf('  workflow_dispatch:'));
  assert.doesNotMatch(pr, /paths:/, 'A required status check must not be path-filtered');
  assert.match(sourceWorkflow, /run: node scripts\/verify-approved-stories\.mjs/);
  assert.match(sourceWorkflow, /name: Juss & Co Site Browser Proof/);
});

test('GitHub webhook receiver test runs in site-proof CI', () => {
  assert.match(sourceWorkflow, /run: node --test tests\/jussco-github-webhook\.test\.mjs/);
});

test('webhook security tests run on every PR and on relevant main pushes', () => {
  const push = sourceWorkflow.slice(sourceWorkflow.indexOf('  push:'), sourceWorkflow.indexOf('  pull_request:'));
  const pr = sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'), sourceWorkflow.indexOf('  workflow_dispatch:'));
  assert.match(push, /tests\/jussco-github-webhook\.test\.mjs/);
  assert.doesNotMatch(pr, /paths:/);
  assert.match(sourceWorkflow, /run: node --test tests\/jussco-github-webhook\.test\.mjs/);
});

test('trusted-checker bootstrap runs its unit tests on every PR', () => {
  const push = sourceWorkflow.slice(sourceWorkflow.indexOf('  push:'),sourceWorkflow.indexOf('  pull_request:'));
  const pr = sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'),sourceWorkflow.indexOf('  workflow_dispatch:'));
  assert.match(push,/scripts\/verify-independent-review\.mjs/);
  assert.match(push,/scripts\/verify-independent-review\.test\.mjs/);
  assert.doesNotMatch(pr,/paths:/);
  assert.match(sourceWorkflow,/node --test scripts\/verify-independent-review\.test\.mjs/);
});
