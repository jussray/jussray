// Regression: Sync Party's founder-declared public link (Juss, 2026-10-14, 7e239ec)
// must stay on the registry and in the static fallback. A bare "link coming"
// state for a world declared Live contradicts the truth rules in CLAUDE.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = new URL('../site/', import.meta.url);
const SYNC_URL = 'https://sync.jussco.company';

test('worlds.json declares the verified SYNC Party link', () => {
  const registry = JSON.parse(readFileSync(fileURLToPath(new URL('data/worlds.json', SITE)), 'utf8'));
  const sync = registry.worlds.find((w) => w.name === 'Sync Party');
  assert.ok(sync, 'Sync Party world exists');
  assert.equal(sync.st, 'live');
  assert.equal(sync.link?.url, SYNC_URL);
  assert.equal(sync.held, undefined, 'a held "link coming" state must not coexist with a declared link');
});

test('static fallback in index.html links Sync Party and drops the "link coming" state', () => {
  const html = readFileSync(fileURLToPath(new URL('index.html', SITE)), 'utf8');
  const start = html.indexOf('{name:"Sync Party"');
  assert.ok(start >= 0, 'fallback entry for Sync Party exists');
  const entry = html.slice(start, html.indexOf('}', html.indexOf('link:[', start)) + 1);
  assert.match(entry, /link:\["Play SYNC Party","https:\/\/sync\.jussco\.company"\]/);
  assert.doesNotMatch(entry, /held:/);
  assert.doesNotMatch(html, /link coming|Public link being added/);
});
