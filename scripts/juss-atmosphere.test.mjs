import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonAt, holidayAt, atmosphereAt } from '../site/assets/juss-season.mjs';

test('northern and southern visitors receive opposite seasons', () => {
  const date = new Date('2026-11-05T12:00:00Z');
  assert.equal(seasonAt(date, 'America/New_York'), 'autumn');
  assert.equal(seasonAt(date, 'Australia/Sydney'), 'spring');
});

test('winter does not depend on a manual visitor theme setting', () => {
  assert.equal(seasonAt(new Date('2026-12-25T12:00:00Z'), 'America/New_York'), 'winter');
  assert.equal(seasonAt(new Date('2026-12-25T12:00:00Z'), 'Australia/Sydney'), 'summer');
});

test('holiday overlays follow founder schedule in visitor local calendar', () => {
  assert.equal(holidayAt(new Date('2026-10-31T18:00:00Z'), 'America/New_York'), 'halloween');
  assert.equal(holidayAt(new Date('2026-12-25T18:00:00Z'), 'America/New_York'), 'winter-lights');
  assert.equal(holidayAt(new Date('2026-07-14T18:00:00Z'), 'America/New_York'), '');
});

test('public atmosphere descriptor exposes no visitor season override', () => {
  const descriptor = atmosphereAt(new Date('2026-11-05T12:00:00Z'), 'America/New_York');
  assert.deepEqual(Object.keys(descriptor).sort(), ['holiday','season','timezone']);
  assert.equal(descriptor.season, 'autumn');
  assert.equal(descriptor.holiday, '');
});
