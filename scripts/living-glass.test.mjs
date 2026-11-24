import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
test('living glass styles are loaded after original homepage layout',()=>{
 const h=read('site/index.html');
 assert.ok(h.indexOf('/assets/living-glass.css')>h.indexOf('/assets/home-world.css'));
 assert.match(h,/id="ecoTrack"/);
 assert.match(h,/id="home-search-toggle"/);
 assert.match(h,/id="sound"/);
 assert.match(h,/id="site-navigation"/);
});
test('scene uses clean landscape and responsive live glass',()=>{
 const c=read('site/assets/living-glass.css');
 assert.match(c,/home-scene\.webp/);
 assert.match(c,/backdrop-filter:blur/);
 assert.match(c,/prefers-reduced-motion:reduce/);
 assert.match(c,/max-width:760px/);
});
test('carousel continues to read declared worlds and not invented statuses',()=>{
 const j=read('site/assets/home-world.mjs');
 assert.match(j,/fetch\('\/data\/worlds\.json'/);
 assert.match(j,/data\.worlds/);
 assert.match(j,/map\(x=>tile\(x\.world\)\)/);
 assert.match(j,/w\.label/);
});
