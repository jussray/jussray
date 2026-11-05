import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectRoute, ROUTES } from './audit-public-routes.mjs';

const html = '<!doctype html><html><head><title>Juss & Co</title></head><body>Ready</body></html>';
const respond = (status, body = html, headers = { 'content-type': 'text/html' }) =>
  new Response([204, 301, 302, 303, 307, 308].includes(status) ? null : body, { status, headers });

test('covers known public pages, not authenticated app or checkout endpoints', () => {
  assert.deepEqual(ROUTES.map(x => new URL(x).pathname).sort(),
    ['/', '/', '/licensing.html', '/robots.txt', '/services.html', '/sitemap.xml', '/work.html'].sort());
});

test('accepts a correct public HTML page', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => respond(200));
  assert.equal(result.outcome, 'pass');
  assert.equal(result.status, 200);
});

test('rejects an HTML security challenge posing as HTTP 200', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => respond(200, '<html>Just a moment...</html>'));
  assert.equal(result.outcome, 'fail');
  assert.equal(result.reason, 'security_challenge');
});

test('accepts permanent canonical apex redirect', async () => {
  const responses = [respond(301, '', { location: 'https://www.jussco.company/' }), respond(200)];
  const result = await inspectRoute('https://jussco.company/', async () => responses.shift());
  assert.equal(result.outcome, 'pass');
  assert.equal(result.status, 200);
  assert.equal(result.redirects, 1);
});

test('temporary apex redirect returns warning rather than false failure', async () => {
  const responses = [respond(302, '', { location: 'https://www.jussco.company/' }), respond(200)];
  const result = await inspectRoute('https://jussco.company/', async () => responses.shift());
  assert.equal(result.outcome, 'warning');
  assert.equal(result.reason, 'temporary_canonical_redirect');
});

test('refuses redirect to a foreign host', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => respond(302, '', { location: 'https://other.example/' }));
  assert.equal(result.outcome, 'fail');
  assert.equal(result.reason, 'unexpected_redirect_host');
});

test('detects redirect loops', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => respond(301, '', { location: '/' }));
  assert.equal(result.outcome, 'fail');
  assert.equal(result.reason, 'redirect_loop');
});

test('preserves exact failure code without guessing who caused it', async () => {
  for (const code of [403, 404, 503]) {
    const result = await inspectRoute('https://www.jussco.company/', async () => respond(code, 'error'));
    assert.equal(result.outcome, 'fail');
    assert.equal(result.status, code);
    assert.equal(result.reason, 'http_' + code);
  }
});

test('network failures are unknown from this vantage, not proof of an outage', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => { throw new Error('DNS unavailable'); });
  assert.equal(result.outcome, 'unknown');
  assert.equal(result.reason, 'probe_network_failure');
  assert.ok(!JSON.stringify(result).includes('DNS unavailable'));
});

test('robots and sitemap must be the intended document, not HTML fallback', async () => {
  const robots = await inspectRoute('https://www.jussco.company/robots.txt', async () => respond(200, 'User-agent: *\nAllow: /', { 'content-type': 'text/plain' }));
  assert.equal(robots.outcome, 'pass');
  const sitemap = await inspectRoute('https://www.jussco.company/sitemap.xml', async () => respond(200, '<urlset></urlset>', { 'content-type': 'application/xml' }));
  assert.equal(sitemap.outcome, 'pass');
  const fallback = await inspectRoute('https://www.jussco.company/sitemap.xml', async () => respond(200));
  assert.equal(fallback.outcome, 'fail');
  assert.equal(fallback.reason, 'unexpected_content');
});

test('does not probe nonstandard ports even on an allowed hostname', async () => {
  const result = await inspectRoute('https://www.jussco.company/', async () => respond(302, '', { location: 'https://www.jussco.company:8443/' }));
  assert.equal(result.outcome, 'fail');
  assert.equal(result.reason, 'unexpected_redirect_host');
});

test('direct apex HTTP 200 is only a canonicalization warning', async () => {
  const result = await inspectRoute('https://jussco.company/', async () => respond(200));
  assert.equal(result.outcome, 'warning');
  assert.equal(result.reason, 'apex_not_redirected');
});
