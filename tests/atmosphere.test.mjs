import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonFor, holidayFor, timePhase, createTimeState } from '../site/assets/atmosphere.mjs';
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

test('visitor timezone determines phase at the same real instant', () => {
  const instant = new Date('2026-11-25T20:00:00Z');
  assert.equal(timePhase(instant, 'America/New_York'), 'day');
  assert.equal(timePhase(instant, 'Europe/London'), 'night');
  assert.equal(timePhase(instant, 'Asia/Tokyo'), 'dawn');
});
test('local boundaries and temporary preview return to automatic time', () => {
  const at = (h, m = 0) => new Date(2026, 10, 25, h, m);
  assert.deepEqual([0,5,8,17,20].map(h => timePhase(at(h))), ['night','dawn','day','sunset','night']);
  const state = createTimeState();
  assert.equal(state.read(at(16,59)), 'day');
  assert.equal(state.cycle(at(16,59)), 'sunset');
  assert.equal(state.read(at(17,0)), 'sunset');
  assert.equal(state.cycle(at(17,1)), 'night');
  assert.equal(state.read(at(17,2)), 'sunset');
});
