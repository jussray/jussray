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
import { resolveAtmosphere, cleanPrefs, DEFAULT_PREFS } from '../site/assets/atmosphere.mjs';
test('Halloween runs on Oct 31 only', () => {
  assert.equal(holidayFor(day(10,31)), 'halloween');
  assert.equal(holidayFor(day(10,30)), '');
  assert.equal(holidayFor(day(11,1)), '');
});
test('visitor preferences resolve the atmosphere (founder, 2026-11-18)', () => {
  const oct31 = day(10,31);
  assert.deepEqual(['season','holiday'].map(k => resolveAtmosphere(DEFAULT_PREFS, oct31, 'America/New_York')[k]), ['autumn','halloween']);
  assert.equal(resolveAtmosphere({ ...DEFAULT_PREFS, season: 'winter' }, oct31, 'America/New_York').season, 'winter');
  assert.equal(resolveAtmosphere({ ...DEFAULT_PREFS, holidays: false }, oct31, 'America/New_York').holiday, '');
  assert.equal(resolveAtmosphere({ ...DEFAULT_PREFS, adaptive: false }, oct31, 'America/New_York').holiday, '');
  assert.equal(resolveAtmosphere({ ...DEFAULT_PREFS, intensity: 40 }, oct31).intensity, 0.4);
});
test('tampered stored preferences fall back to safe defaults', () => {
  assert.deepEqual(cleanPrefs({ season: '<script>', mood: 'x', intensity: 999, adaptive: 'yes' }), { ...DEFAULT_PREFS, intensity: 100 });
  assert.deepEqual(cleanPrefs(null), { ...DEFAULT_PREFS });
});
