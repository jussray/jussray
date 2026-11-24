// Guard for the agent-discovery surface on jussco.company: the API catalog
// (RFC 9727 linkset) and the homepage Link headers may only point at public
// files that actually ship in site/. Nothing here may advertise auth, OAuth,
// agents, or MCP: the static site has none of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const ORIGIN = 'https://www.jussco.company';

const catalog = JSON.parse(readFileSync(join(SITE, '.well-known', 'api-catalog'), 'utf8'));
const headers = readFileSync(join(SITE, '_headers'), 'utf8');

test('api-catalog is an RFC 9727 linkset anchored at the canonical origin', () => {
  assert.equal(catalog.linkset.length, 1);
  assert.equal(catalog.linkset[0].anchor, `${ORIGIN}/.well-known/api-catalog`);
  assert.ok(catalog.linkset[0].item.length > 0);
});

test('every catalog item is a parseable JSON file that ships in site/', () => {
  for (const { href, type } of catalog.linkset[0].item) {
    assert.ok(href.startsWith(`${ORIGIN}/`), href);
    assert.equal(type, 'application/json');
    const file = join(SITE, href.slice(ORIGIN.length + 1));
    assert.ok(existsSync(file), `${href} is not in site/`);
    JSON.parse(readFileSync(file, 'utf8'));
  }
});

test('every Link header target ships in site/', () => {
  const targets = [...headers.matchAll(/<([^>]+)>/g)].map((m) => m[1]);
  assert.ok(targets.includes('/.well-known/api-catalog'));
  for (const t of targets) assert.ok(existsSync(join(SITE, t)), `${t} is not in site/`);
});

test('api-catalog is served as application/linkset+json', () => {
  assert.match(headers, /\/\.well-known\/api-catalog\n\s+Content-Type: application\/linkset\+json/);
});

test('no unbacked auth/agent discovery files are published', () => {
  for (const p of ['auth.md', '.well-known/agent-card.json', '.well-known/oauth-protected-resource',
    '.well-known/oauth-authorization-server', '.well-known/openid-configuration', '.well-known/mcp/server-card.json']) {
    assert.equal(existsSync(join(SITE, p)), false, `${p} would advertise a capability jussco.company does not have`);
  }
});


test('agent catalog advertises only the sanitized discovery and licensing feeds', () => {
  assert.deepEqual(catalog.linkset[0].item.map(x => x.href).sort(), [
    ORIGIN + '/data/discovery.json', ORIGIN + '/data/licensable-assets.json'
  ].sort());
  assert.match(headers, /<\/data\/discovery\.json>; rel="describedby"/);
  assert.doesNotMatch(headers, /<\/data\/(worlds|systems|connectors)\.json>/);
});

test('discovery projection matches sitemap and llms and does not claim runtime proof', () => {
  const d = JSON.parse(readFileSync(join(SITE, 'data/discovery.json'), 'utf8'));
  assert.deepEqual(Object.keys(d).sort(), ['canonicalOrigin','company','pages','products','schema'].sort());
  assert.equal(d.canonicalOrigin, ORIGIN);
  const sitemap = readFileSync(join(SITE, 'sitemap.xml'), 'utf8');
  const llms = readFileSync(join(SITE, 'llms.txt'), 'utf8');
  const crawlers = JSON.parse(readFileSync(join(SITE, 'crawlers.json'), 'utf8'));
  assert.equal(crawlers.discoveryManifest, ORIGIN + '/data/discovery.json');
  assert.deepEqual(d.pages, [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
  for (const page of d.pages) {
    assert.ok(page.startsWith(ORIGIN + '/'));
    assert.ok(llms.includes(page), 'llms missing ' + page);
    const p = new URL(page).pathname;
    assert.ok(existsSync(join(SITE, p.endsWith('/') ? p + 'index.html' : p)), 'missing source ' + p);
  }
  assert.ok(d.products.length >= 10);
  assert.equal(new Set(d.products.map(x => x.name)).size, d.products.length);
  for (const p of d.products) {
    assert.deepEqual(Object.keys(p).sort(), ['name','purpose','source','sourceStatus','operationStatus'].sort());
    assert.match(p.source, /^https:\/\/github\.com\/jussray\/[A-Za-z0-9_.-]+$/);
    assert.equal(p.sourceStatus, 'public_source_observed');
    assert.equal(p.operationStatus, 'unknown');
    assert.ok(llms.includes(p.source), 'llms missing ' + p.name);
  }
});


test('public presentation feeds exclude private carrier and implementation metadata', () => {
  const read = p => JSON.parse(readFileSync(join(SITE, 'data', p), 'utf8'));
  const worlds = read('worlds.json');
  const systems = read('systems.json');
  const connectors = read('connectors.json');
  const portfolio = read('portfolio.json');
  assert.equal(worlds.worlds.length, 16);
  for (const w of worlds.worlds) {
    assert.ok(Object.keys(w).every(k => ['name','repo','st','label','contact','evidence','display','link','held'].includes(k)));
    assert.deepEqual(w.evidence, {});
  }
  assert.equal(systems.systems.length, 5);
  for (const s of systems.systems) {
    assert.equal(s.public, true);
    assert.ok(Object.keys(s).every(k => ['name','kind','public','status','label','role','publicUrl'].includes(k)));
  }
  assert.deepEqual(connectors.systems, {});
  assert.ok(connectors.lanes.every(l => Object.keys(l).every(k => ['id','name'].includes(k))));
  for (const s of systems.supportingSurfaces || []) {
    assert.ok(Object.keys(s).every(k => ['name','parent','status','kind'].includes(k)));
  }
  assert.doesNotMatch(JSON.stringify(portfolio), /id-preview--|\.lovable\.app/);
  assert.doesNotMatch(readFileSync(join(SITE, 'portfolio.html'), 'utf8'), /id-preview--/);
  assert.equal(portfolio.projects.length, 20);
});


test('sanitized world feed preserves all previously declared public destinations', () => {
  const worlds = JSON.parse(readFileSync(join(SITE, 'data/worlds.json'), 'utf8')).worlds;
  const expected = [
  [
    "Se'kret Bip",
    "https://sekretbip.net"
  ],
  [
    "Founder Control Room",
    "https://foundercontrolroom.org"
  ],
  [
    "Chief AI",
    "https://github.com/jussray/chief-ai-machine"
  ],
  [
    "Juss Beautiful Hair",
    "https://jussbeautifulhair.com"
  ],
  [
    "Sync Party",
    "https://sync.jussco.company/"
  ],
  [
    "PromptOS",
    "https://github.com/jussray/promptos"
  ],
  [
    "SolContinuity",
    "https://github.com/jussray/solcontinuity"
  ],
  [
    "SleepWealth Agent",
    "https://github.com/jussray/SleepWealth-Agent"
  ],
  [
    "Solwealth",
    "https://github.com/jussray/SolWealth-Meteora-"
  ],
  [
    "Think Tank",
    "https://thinktank.jussco.company/"
  ]
];
  assert.deepEqual(worlds.filter(w => w.link).map(w => [w.name,w.link.url]), expected);
  assert.ok(worlds.filter(w => w.link).every(w => !w.held));
});
