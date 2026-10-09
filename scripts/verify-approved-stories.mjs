// Fail closed before a public story feed is deployed.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const data = JSON.parse(readFileSync(new URL('../site/data/approved-stories.json', import.meta.url), 'utf8'));
assert.equal(data.schema, 'jussco/approved-stories@v1');
assert.ok(Array.isArray(data.stories) && data.stories.length <= 100);
const allowed = new Set(['id','project','title','summary','proofUrl','approved','publicationApproved','destination','approvalReceipt','approvedAt']);
const ids = new Set();
for (const story of data.stories) {
  assert.ok(story && typeof story === 'object' && !Array.isArray(story));
  assert.ok(Object.keys(story).every(k => allowed.has(k)), 'unexpected public field');
  assert.equal(story.approved, true, 'unapproved story must not enter public feed');
  assert.equal(story.publicationApproved, true, 'cross-brand approval required');
  assert.equal(story.destination, 'jussco.company');
  for (const k of ['id','project','title','summary','approvalReceipt']) {
    assert.ok(typeof story[k] === 'string' && story[k].trim() && story[k].length <= (k === 'summary' ? 600 : 180), k);
  }
  assert.ok(!ids.has(story.id), 'duplicate story'); ids.add(story.id);
  assert.match(story.approvalReceipt, /^https:\/\//, 'public approval receipt required');
  assert.match(story.proofUrl, /^https:\/\//, 'public proof required');
  assert.ok(!/[<>]/.test(story.title + story.summary), 'no markup in public copy');
  assert.ok(Number.isFinite(Date.parse(story.approvedAt)), 'approval timestamp required');
}
console.log('approved outcome feed: public-only schema gate passed (' + data.stories.length + ' stories)');
