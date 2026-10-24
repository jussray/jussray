import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import receiver from '../workers/jussco-github-webhook.mjs';

const secret = 'integration-test-only-secret-32-chars-minimum';
const env = { GITHUB_WEBHOOK_SECRET: secret };
const base = 'https://hooks.jussco.company';
function signedRequest(event, body = '{}', overrides = {}) {
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return new Request(base + '/github', {
    method: 'POST', body,
    headers: { 'x-github-event': event, 'x-hub-signature-256': 'sha256=' + sig, ...overrides }
  });
}

test('health is unready without a secret', async () => {
  const result = await receiver.fetch(new Request(base + '/health'), {});
  assert.equal(result.status, 503);
  assert.equal(await result.text(), 'not configured');
});
test('health becomes ready when secret bound', async () => {
  const result = await receiver.fetch(new Request(base + '/health'), env);
  assert.equal(result.status, 200);
});
test('reject unsupported paths and methods', async () => {
  assert.equal((await receiver.fetch(new Request(base + '/'), env)).status, 404);
  assert.equal((await receiver.fetch(new Request(base + '/github'), env)).status, 405);
});
test('refuse webhook when secret not configured', async () => {
  assert.equal((await receiver.fetch(new Request(base + '/github', { method:'POST',body:'{}' }), {})).status,503);
});
test('unsigned and malformed requests are rejected', async () => {
  assert.equal((await receiver.fetch(new Request(base + '/github',{method:'POST',body:'{}'}),env)).status,401);
  assert.equal((await receiver.fetch(signedRequest('ping','{}',{ 'x-hub-signature-256':'sha256=bad' }),env)).status,401);
});
test('incorrect signature rejected', async () => {
  const request = signedRequest('push', '{"tamper":true}');
  const goodSig = request.headers.get('x-hub-signature-256');
  const badRequest = signedRequest('push','{}',{'x-hub-signature-256':goodSig});
  assert.equal((await receiver.fetch(badRequest,env)).status,401);
});
test('correctly signed ping accepted', async () => {
  const result=await receiver.fetch(signedRequest('ping'),env);
  assert.equal(result.status,200);
  assert.equal(await result.text(),'pong');
});
test('correctly signed allowed event acknowledged without side effects', async () => {
  const result=await receiver.fetch(signedRequest('push'),env);
  assert.equal(result.status,202);
  assert.match(await result.text(),/automation disabled/);
});
test('signed unrecognized event ignored', async () => {
  const result=await receiver.fetch(signedRequest('marketplace_purchase'),env);
  assert.equal(result.status,200);
});
test('oversized signed payload rejected', async () => {
  const result=await receiver.fetch(signedRequest('push','x'.repeat(1048577)),env);
  assert.equal(result.status,413);
});
