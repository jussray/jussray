import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

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

test('browser proof source parses and contains no unresolved merge markers', () => {
  assert.doesNotMatch(sourceProof, /^(?:<{7}(?: .*)?|={7}|>{7}(?: .*)?)$/m,
    'site browser verification must not contain unresolved merge conflict delimiters');
  const syntax = spawnSync(process.execPath, ['--check', 'scripts/verify-site.mjs'], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
});

test('flagship hero remains visible and mobile games decoration does not extend beyond viewport', () => {
  const homepage = readFileSync('site/index.html', 'utf8');
  const games = readFileSync('site/games/index.html', 'utf8');
  assert.doesNotMatch(homepage, /\.hero-bg,\.hero-notes,#stars\{display:none!important\}/,
    'legacy forced hide must not disable cinematic artwork');
  assert.match(homepage, /\.hero-bg,#stars\{display:none!important\}/,
    'obsolete background layers remain disabled without hiding the new artwork');
  assert.doesNotMatch(games, /right:-20px;top:6%;opacity:\.20/,
    'mobile decorative element must not extend past viewport');
  assert.match(games, /right:0;top:6%;opacity:\.20/,
    'mobile decorative element stays within the screen');
});
