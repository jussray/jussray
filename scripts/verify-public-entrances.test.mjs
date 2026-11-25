import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPublicEntrance, validatePublicUrl } from './verify-public-entrances.mjs';

const html = '<!doctype html><html><head><title>Juss &amp; Co | Turn thoughts into living works</title></head><body>Juss &amp; Co</body></html>';
function response(status, body = html, headers = {}) {
  return { status, headers: new Headers({'content-type':'text/html', ...headers}), text: async () => body };
}

test('only canonical public homepage URLs may be fetched', () => {
  for (const url of ['https://jussco.company/', 'https://www.jussco.company/']) assert.doesNotThrow(() => validatePublicUrl(url));
  for (const url of ['http://jussco.company/', 'https://evil.invalid/', 'https://jussco.company/admin', 'https://jussco.company/?token=secret', 'https://user@jussco.company/']) assert.throws(() => validatePublicUrl(url), /approved public homepage/);
});

test('real Juss & Co HTML is required; 200 alone is not proof', async () => {
  const pass = await inspectPublicEntrance('https://www.jussco.company/', { request: async () => response(200) });
  assert.equal(pass.state, 'PASS');
  const fake = await inspectPublicEntrance('https://www.jussco.company/', { request: async () => response(200, '<html>Other website</html>') });
  assert.equal(fake.state, 'FAIL');
});

test('Access redirects and WAF challenges cannot pass as an open public entrance', async () => {
  for (const body of ['<html><title>Just a moment...</title></html>', '<html>Sign in ・ Cloudflare Access</html>', '<html>cf-chl</html>']) {
    const result = await inspectPublicEntrance('https://www.jussco.company/', { request: async () => response(200, body) });
    assert.equal(result.state, 'BLOCKED');
  }
  const forbidden = await inspectPublicEntrance('https://jussco.company/', { request: async () => response(302, '', {location:'https://admin.jussco.company/'}) });
  assert.equal(forbidden.state, 'BLOCKED');
  for (const status of [401,403,503]) {
    const res = await inspectPublicEntrance('https://jussco.company/', { request: async () => response(status) });
    assert.equal(res.state, 'BLOCKED');
  }
});

test('apex-to-www HTTPS redirect is permitted but loops are rejected', async () => {
  const pass = await inspectPublicEntrance('https://jussco.company/', {
    request: async (url) => url === 'https://jussco.company/'
      ? response(301, '', { location:'https://www.jussco.company/' }) : response(200)
  });
  assert.equal(pass.state,'PASS');
  const loop = await inspectPublicEntrance('https://jussco.company/', {
    request: async () => response(301, '', { location:'https://jussco.company/' })
  });
  assert.equal(loop.state,'BLOCKED');
});

test('network failure and unexpected content type are not green', async () => {
  const errored = await inspectPublicEntrance('https://www.jussco.company/', { request: async () => { throw new Error('network offline'); } });
  assert.equal(errored.state, 'UNKNOWN');
  const nonHtml = await inspectPublicEntrance('https://www.jussco.company/', { request: async () => response(200, html, {'content-type':'application/json'}) });
  assert.equal(nonHtml.state,'FAIL');
});
