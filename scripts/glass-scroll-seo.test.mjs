// Juss & Co: canonical glass-scroll and truthful service-discovery contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const css = read('site/assets/glass-scroll.css');
const service = read('site/services.html');
const pages = ['index.html', 'services.html', 'work.html', 'portfolio.html', 'creative-history.html', 'licensing.html'];

test('public company pages use one canonical glass scroll layer', () => {
  for (const name of pages) {
    const html = read('site/' + name);
    assert.match(html, /<body class="jc-glass-scroll">/, name);
    assert.equal((html.match(/href="\/assets\/glass-scroll\.css"/g) || []).length, 1, name);
  }
});

test('glass scroll uses independently twinkling fixed layers and an accessible fallback', () => {
  assert.match(css, /body\.jc-glass-scroll::before/);
  assert.match(css, /body\.jc-glass-scroll::after/);
  assert.match(css, /position:fixed/);
  assert.match(css, /jc-glass-twinkle-a 8\.7s/);
  assert.match(css, /jc-glass-twinkle-b 5\.9s/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /animation:none/);
  assert.match(css, /-webkit-backdrop-filter/);
  assert.match(css, /pointer-events:none/);
  assert.doesNotMatch(css, /(?:^|[;{])\s*background-attachment\s*:/m);
});

test('Work with Juss has a single canonical and consistent SEO / social metadata', () => {
  assert.match(service, /<title>Work with Juss Rayy/);
  assert.match(service, /<meta name="robots" content="index,follow">/);
  for (const pattern of [/<meta name="description"/g, /<meta property="og:title"/g, /<meta property="og:image"/g, /<link rel="canonical"/g, /<meta name="twitter:image"/g]) {
    assert.equal((service.match(pattern) || []).length, 1, String(pattern));
  }
  assert.match(service, /<link rel="canonical" href="https:\/\/www\.jussco\.company\/services\.html">/);
});

test('structured service and FAQ answers exactly match visible public claims', () => {
  const scripts = [...service.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  const data = JSON.parse(scripts[0][1]);
  const nodes = data['@graph'];
  const byType = (type) => nodes.find(x => x['@type'] === type);
  assert.equal(byType('Organization').name, 'Juss & Co');
  assert.equal(byType('Person').name, 'Juss Rayy');
  assert.equal(byType('WebPage').url, 'https://www.jussco.company/services.html');
  const options = byType('ItemList').itemListElement.map(x => x.item);
  assert.deepEqual(options.map(x => x.name), ['Quick Audit', 'Fix Sprint', 'Build Sprint']);
  for (const [i, price] of [49, 149, 399].entries()) {
    assert.equal(options[i].offers.priceCurrency, 'USD');
    assert.equal(Number(options[i].offers.price), price);
    assert.ok(service.includes('<div class="price">$' + price + '</div>'));
    assert.match(options[i].offers.description, /Inquiry only/i);
  }
  const faq = byType('FAQPage').mainEntity;
  assert.equal(faq.length, 4);
  for (const question of faq) {
    assert.ok(service.includes(question.name), question.name);
    assert.ok(service.includes(question.acceptedAnswer.text), question.name);
  }
  assert.ok(service.includes('this page creates an inquiry path, not proof that payment was collected'));
});

test('SEO discovery files preserve canonical page inclusion and search-vs-training boundaries', () => {
  const sitemap = read('site/sitemap.xml');
  const robots = read('site/robots.txt');
  const llms = read('site/llms.txt');
  assert.match(sitemap, /https:\/\/www\.jussco\.company\/services\.html/);
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /ai-train=no/);
  assert.match(llms, /https:\/\/www\.jussco\.company\/services\.html/);
});