import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../wrangler.games.jsonc', import.meta.url), 'utf8'));

test('Games Worker declares an isolated preview configuration for Cloudflare Builds', () => {
  assert.equal(config.name, 'jussco-games');
  assert.deepEqual(config.previews, {}, 'Wrangler preview requires a previews block');
});

test('Games Worker keeps its production route and asset root unchanged', () => {
  assert.deepEqual(config.assets, { directory: './site/games' });
  assert.deepEqual(config.routes, [{ pattern: 'games.jussco.company', custom_domain: true }]);
});

// Games is deployed independently from the company site's asset directory.
// Fail if a shared runtime or stylesheet is absent or diverges in either carrier.
test('Games Worker ships byte-identical shared atmosphere assets', () => {
  for (const name of ["atmosphere.mjs","studio-world.css","atmosphere.css","ambience.mjs"]) {
    const source = readFileSync(new URL('../site/assets/'+name, import.meta.url));
    const game = readFileSync(new URL('../site/games/assets/'+name, import.meta.url));
    assert.deepEqual(game, source, name+' must match the canonical company asset');
  }
});

test('shared brand polish retains visible keyboard focus and wrapping regional controls', () => {
  const css = readFileSync(new URL('../site/assets/studio-world.css', import.meta.url), 'utf8');
  assert.match(css, /\.studio-world :is\(a,button,input,select,textarea\):focus-visible\s*\{\s*outline:2px solid #ffd98a/);
  assert.match(css, /\.studio-world \.local-environment > \* \{max-width:100%; overflow-wrap:anywhere;\}/);
});
