import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonFor, holidayFor } from '../site/assets/atmosphere.mjs';
const day = (month, date = 15) => new Date(2026, month - 1, date, 12);
test('seasons change by local calendar month and southern hemisphere', () => {
  assert.deepEqual([1,4,7,10].map(m => seasonFor(day(m), 'America/New_York')), ['winter','spring','summer','autumn']);
  assert.deepEqual([1,4,7,10].map(m => seasonFor(day(m), 'Australia/Sydney')), ['summer','autumn','winter','spring']);
  assert.equal(seasonFor(day(12), 'America/Argentina/Buenos_Aires'), 'summer');
  assert.equal(seasonFor(day(12), 'America/Buenos_Aires'), 'summer');
  assert.equal(seasonFor(day(7), 'America/Buenos_Aires'), 'winter');
});
test('holiday effects are limited to their intended dates', () => {
  assert.equal(holidayFor(day(12,20)), 'winter-lights');
  assert.equal(holidayFor(day(12,27)), '');
  assert.equal(holidayFor(day(12,31)), 'new-year');
  assert.equal(holidayFor(day(1,1)), 'new-year');
  assert.equal(holidayFor(day(1,2)), '');
});
