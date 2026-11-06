import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phaseAt } from '../site/assets/juss-day-night.mjs';

test('daytime keeps the same scene at midday in local timezone', () => {
  assert.equal(phaseAt(new Date('2026-11-05T17:00:00Z'), 'America/New_York'), 'day');
});
test('evening switches to dusk in the visitor timezone', () => {
  assert.equal(phaseAt(new Date('2026-11-05T23:00:00Z'), 'America/New_York'), 'dusk');
});
test('full nighttime activates the moonlit composition', () => {
  assert.equal(phaseAt(new Date('2026-11-06T04:00:00Z'), 'America/New_York'), 'night');
});
test('early dawn uses the existing twilight transition', () => {
  assert.equal(phaseAt(new Date('2026-11-05T10:30:00Z'), 'America/New_York'), 'dusk');
});
test('local clock takes priority over UTC', () => {
  const stamp = new Date('2026-11-05T23:00:00Z');
  assert.equal(phaseAt(stamp, 'Europe/London'), 'night');
  assert.equal(phaseAt(stamp, 'America/Los_Angeles'), 'day');
});
