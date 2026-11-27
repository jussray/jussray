import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'site/the-edit.html'), 'utf8');

test('editorial preview is isolated from the published homepage and search indexing', () => {
  assert.match(html, /<title>The Edit — Juss & Co \| Editorial Preview<\/title>/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /Editorial preview only\./);
  assert.doesNotMatch(html, />Daybreak Watch<|FOUNDER APPROVED|VERIFIED \u2713|<script\s+src=/);
});

test('scene references the existing Juss & Co asset without changing the original site', () => {
  assert.match(html, /url\('\/assets\/home-scene\.webp'\)/);
  assert.match(html, /\.scene\s*\{[^}]*position:fixed/s);
  assert.match(html, /<div class="scene" aria-hidden="true"><\/div>/);
});

test('editorial content links to the existing portfolio, work, and ideas pages', () => {
  for(const path of ['/portfolio.html','/work.html','/products.html','/ideas.html','/']) {
    assert.ok(html.includes(`href="${path}"`), `missing known route: ${path}`);
  }
  assert.equal((html.match(/class="editorial"/g)||[]).length, 3);
});

test('ambient scene has subtle motion and respects reduced-motion preference', () => {
  assert.match(html, /@keyframes\s+scene-drift/);
  assert.match(html, /\.scene\s*\{[^}]*animation:\s*scene-drift/s);
  assert.match(html, /@media\s*\(prefers-reduced-motion:reduce\)\s*\{[^}]*\.scene\s*\{[^}]*animation:\s*none/s);
});

test('editorial has a dedicated printable layout with readable ink and no interactive chrome', () => {
  assert.match(html, /@page\s*\{[^}]*margin:\s*0\.6in/s);
  assert.match(html, /@media\s+print\s*\{/);
  const print = html.split('@media print {')[1].split('</style>')[0];
  assert.match(print, /\.scene[^{}]*\{[^}]*display:\s*none/s);
  assert.match(print, /body\s*\{[^}]*color:\s*#17131c/s);
  assert.match(print, /\.editorial\s*\{[^}]*break-inside:\s*avoid/s);
  assert.match(html, /Print or save as PDF using your browser/);
});
