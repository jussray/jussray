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
  assert.doesNotMatch(sourceProof, /https:\/\/games\.jussco\.company\//);
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

test('PR path filter includes the publication-lock gate', () => {
  const pr = sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'), sourceWorkflow.indexOf('  workflow_dispatch:'));
  assert.match(pr, /scripts\/verify-approved-stories\.mjs/);
});

test('GitHub webhook receiver test runs in site-proof CI', () => {
  assert.match(sourceWorkflow, /run: node --test tests\/jussco-github-webhook\.test\.mjs/);
});

test('webhook receiver test file changes trigger both push and PR site proof', () => {
  const push = sourceWorkflow.slice(sourceWorkflow.indexOf('  push:'), sourceWorkflow.indexOf('  pull_request:'));
  const pr = sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'), sourceWorkflow.indexOf('  workflow_dispatch:'));
  assert.match(push, /tests\/jussco-github-webhook\.test\.mjs/);
  assert.match(pr, /tests\/jussco-github-webhook\.test\.mjs/);
  assert.match(sourceWorkflow, /run: node --test tests\/jussco-github-webhook\.test\.mjs/);
});

test('trust-checker bootstrap is pinned to tested source and cannot skip CI', () => {
  for (const section of [
    sourceWorkflow.slice(sourceWorkflow.indexOf('  push:'),sourceWorkflow.indexOf('  pull_request:')),
    sourceWorkflow.slice(sourceWorkflow.indexOf('  pull_request:'),sourceWorkflow.indexOf('  workflow_dispatch:'))
  ]) {
    assert.match(section,/scripts\/verify-independent-review\.mjs/);
    assert.match(section,/scripts\/verify-independent-review\.test\.mjs/);
  }
  assert.match(sourceWorkflow,/node --test scripts\/verify-independent-review\.test\.mjs/);
});
