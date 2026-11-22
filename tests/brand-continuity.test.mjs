import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const home = source('site/index.html');
const hero = source('site/assets/home-world.css');
const shell = source('site/assets/world-shell.css');
const pages = source('site/assets/landing-pages.css');

test('homepage uses a decorative water layer separate from interactive content', () => {
  assert.match(home, /<div class="scene-motion" aria-hidden="true"><\/div>/);
  assert.match(hero, /\.home-world \.scene-motion\{[^}]*pointer-events:none/s);
  assert.match(hero, /\.home-world \.world-stage\.cinematic::before\{[^}]*background-position/s);
});

test('standard pages retain a fixed shared scene when scrolling', () => {
  assert.match(pages, /body:not\(\.home-world\)\{[^}]*home-scene\.webp[^}]*fixed no-repeat/s);
  assert.match(pages, /body:not\(\.home-world\) \.page-main\{[^}]*rgba\(/s);
});

test('world shell keeps more scene visible than the previous near-opaque tint', () => {
  assert.match(shell, /\.ws-scene \.tint\{background:linear-gradient\(180deg,rgba\(10,6,30,\.38\),rgba\(10,6,30,\.58\)\)\}/);
});

test('motion remains decorative and is disabled by reduced-motion preference', () => {
  assert.match(hero, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.home-world \.scene-motion::after/s);
  assert.match(shell, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.ws-scene \.art\{animation:none!important/s);
});
