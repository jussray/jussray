// IndexNow contract: exactly one key file at the site root whose content equals its filename key.
// Keys are 8-128 chars from [A-Za-z0-9-]; the file must be publicly served so search engines can verify ownership.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const keyFiles = readdirSync(siteRoot).filter((name) => /^[A-Za-z0-9-]{8,128}\.txt$/.test(name));

test('exactly one IndexNow key file sits at the site root', () => {
  assert.equal(keyFiles.length, 1, `expected 1 key file, found ${keyFiles.length}`);
});

test('key file content equals its filename key', () => {
  const key = keyFiles[0].replace(/\.txt$/, '');
  assert.equal(readFileSync(join(siteRoot, keyFiles[0]), 'utf8'), key);
});
