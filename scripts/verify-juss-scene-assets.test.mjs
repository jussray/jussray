import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifySceneAssets } from './verify-juss-scene-assets.mjs';

const payload = Buffer.from('RIFFtestWEBPday');
const digest = createHash('sha256').update(payload).digest('hex');
const manifest = {
  assets:[{ phase:'day', path:'/assets/scenes/juss-world-day-test.webp', derivativeSha256:digest }]
};
test('asset verification accepts exact public derivative bytes', () => {
  assert.deepEqual(verifySceneAssets(manifest, () => payload), []);
});
test('asset verification rejects altered bytes', () => {
  assert.match(verifySceneAssets(manifest, () => Buffer.from('different'))[0], /hash mismatch/);
});
test('asset verification flags missing binary assets', () => {
  assert.match(verifySceneAssets(manifest, () => { throw new Error('ENOENT'); })[0], /missing/);
});
test('asset verification rejects path traversal', () => {
  const bad = { assets:[{ phase:'day', path:'/assets/scenes/../../private.webp', derivativeSha256:digest }] };
  assert.match(verifySceneAssets(bad, () => payload)[0], /unsafe path/);
});
