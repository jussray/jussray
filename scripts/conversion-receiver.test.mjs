import test from 'node:test';
import assert from 'node:assert/strict';
import receiver, { validEvent } from '../workers/conversion-receiver.mjs';
const sample = { event: 'contact_click', project: 'juss-and-co', surface: 'front_door', action: 'copy_email', schema: 'v1' };
const endpoint = 'https://www.jussco.company/_telemetry/v1';
function makeDB() {
  const counts = new Map();
  return { counts, prepare(sql) {
    assert.match(sql, /ON CONFLICT\(day, event, action\)/);
    return { bind(day, event, action) { return { async run() {
      const key = [day, event, action].join('|');
      counts.set(key, (counts.get(key) || 0) + 1);
    } }; } };
  } };
}
function request(payload = sample, url = endpoint, origin = 'https://www.jussco.company') {
  return new Request(url, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}
test('accepted events increment only daily aggregate counters', async () => {
  const DB = makeDB();
  assert.equal((await receiver.fetch(request(), { DB })).status, 204);
  assert.equal((await receiver.fetch(request(), { DB })).status, 204);
  assert.equal(DB.counts.size, 1);
  assert.equal([...DB.counts.values()][0], 2);
  assert.equal([...DB.counts.keys()][0].endsWith('|contact_click|copy_email'), true);
});
test('wrong origin, path, method, and fetch-site fail closed', async () => {
  const DB = makeDB();
  for (const [req, status] of [
    [request(sample, endpoint, 'https://evil.example'), 403],
    [request(sample, 'https://www.jussco.company/_telemetry/v1extra'), 404],
    [request(sample, endpoint + '?email=hidden'), 404],
    [new Request(endpoint), 405],
    [new Request(endpoint, { method: 'POST', headers: { Origin: 'https://www.jussco.company', 'Sec-Fetch-Site': 'cross-site', 'Content-Type': 'application/json' }, body: JSON.stringify(sample) }), 403],
  ]) assert.equal((await receiver.fetch(req, { DB })).status, status);
  assert.equal(DB.counts.size, 0);
});
test('payload allowlist excludes private data and invented events', async () => {
  const DB = makeDB();
  for (const payload of [
    { ...sample, email: 'private@example.org' },
    { ...sample, url: 'https://example.org/?secret=1' },
    { ...sample, action: 'message_sent' },
    { ...sample, event: 'purchase_completed' },
    { ...sample, project: 'sekret-bip' },
    { ...sample, surface: 'teen_journal' },
    { ...sample, schema: 'v2' },
    [sample],
  ]) assert.equal((await receiver.fetch(request(payload), { DB })).status, 400);
  assert.equal(DB.counts.size, 0);
  assert.equal(validEvent(sample), true);
});
test('large, malformed, wrong-type, missing binding and failed DB do not persist', async () => {
  const DB = makeDB();
  assert.equal((await receiver.fetch(request({ ...sample, unused: 'X'.repeat(600) }), { DB })).status, 413);
  assert.equal((await receiver.fetch(new Request(endpoint, { method: 'POST', headers: { Origin: 'https://www.jussco.company', 'Content-Type': 'text/plain' }, body: '{}' }), { DB })).status, 415);
  assert.equal((await receiver.fetch(new Request(endpoint, { method: 'POST', headers: { Origin: 'https://www.jussco.company', 'Content-Type': 'application/json' }, body: '{not json' }), { DB })).status, 400);
  assert.equal((await receiver.fetch(request(), {})).status, 503);
  assert.equal((await receiver.fetch(request(), { DB: { prepare() { throw Error('offline'); } } })).status, 503);
  assert.equal(DB.counts.size, 0);
});
