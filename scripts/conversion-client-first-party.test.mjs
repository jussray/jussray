import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const code = readFileSync(new URL('../site/assets/conversion-tracking.js', import.meta.url), 'utf8');
function harness({ gpc = false, dnt = '0', fetchImpl } = {}) {
  const hits = [], tracks = [], listeners = [];
  const window = {
    location: { href: 'https://www.jussco.company/' }, doNotTrack: '0',
    fetch: fetchImpl || ((url, init) => { hits.push({ url, init }); return Promise.resolve({ status: 204 }); }),
    zaraz: { track(name, props) { tracks.push({ name, props }); } },
  };
  const document = { addEventListener(type, fn) { listeners.push({ type, fn }); } };
  runInNewContext(code, { window, document, navigator: { globalPrivacyControl: gpc, doNotTrack: dnt }, URL });
  return { hits, tracks, click(target) { listeners[0].fn({ target }); } };
}
function target(href) {
  const a = { getAttribute() { return href; }, matches(selector) { return selector === '#dCta a'; } };
  return { closest(selector) { return selector === 'a[href]' ? a : null; } };
}
test('first-party transport sends fixed fields without URL, cookies, identities or preflight origins', () => {
  const h = harness();
  h.click(target('mailto:private.person@example.org'));
  assert.equal(h.hits.length, 1);
  assert.equal(h.hits[0].url, '/_telemetry/v1');
  assert.equal(h.hits[0].init.method, 'POST');
  assert.equal(h.hits[0].init.credentials, 'omit');
  assert.equal(h.hits[0].init.keepalive, true);
  const p = JSON.parse(h.hits[0].init.body);
  assert.equal(p.event, 'contact_click');
  assert.deepEqual(Object.keys(p).sort(), ['action','event','project','schema','surface']);
  assert.equal(JSON.stringify(p).includes('private.person'), false);
  assert.equal(h.tracks.length, 1);
});
test('opt-out suppresses both transports', () => {
  for (const o of [{ gpc: true }, { dnt: '1' }]) {
    const h = harness(o); h.click(target('mailto:test@invalid.org'));
    assert.equal(h.hits.length, 0); assert.equal(h.tracks.length, 0);
  }
});
test('transport failures never interrupt a visitor click', () => {
  const h = harness({ fetchImpl() { throw Error('offline'); } });
  assert.doesNotThrow(() => h.click(target('mailto:test@invalid.org')));
  assert.equal(h.tracks.length, 1);
});
