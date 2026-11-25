import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seasonFor, holidayFor, timePhase, createTimeState, solarPhase, regionalEvent, formatLocalDateTime, localizedPhrase } from '../site/assets/atmosphere.mjs';
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

test('solar phases follow geography and polar daylight', () => {
  for(const [d,c,phase] of [["2026-06-21T12:00:00Z",{"latitude":51.5,"longitude":0},"day"],["2026-06-21T00:00:00Z",{"latitude":51.5,"longitude":0},"night"],["2026-03-20T06:00:00Z",{"latitude":0,"longitude":0},"dawn"],["2026-03-20T18:00:00Z",{"latitude":0,"longitude":0},"sunset"],["2026-06-21T00:00:00Z",{"latitude":78.2,"longitude":15.6},"day"],["2026-12-21T12:00:00Z",{"latitude":78.2,"longitude":15.6},"night"]]) assert.equal(solarPhase(new Date(d),c),phase);
  assert.equal(solarPhase(new Date(),{latitude:91,longitude:0}),null);
});
test('regional dates do not assume every visitor celebrates the same holiday', () => {
  assert.equal(regionalEvent(new Date(2026,6,4),'US'),'independence-day');
  assert.equal(regionalEvent(new Date(2026,6,4),'JP'),'');
});
test('regional date format observes locale and timezone', () => {
  const d=new Date('2026-11-25T20:00:00Z');
  assert.notEqual(formatLocalDateTime(d,'ja-JP','Asia/Tokyo'),formatLocalDateTime(d,'en-US','America/New_York'));
});

test('authored translations preserve untranslated brand and unsupported locale fallback',()=>{
  assert.equal(localizedPhrase('Creative Technology','ja'),'クリエイティブテクノロジー');
  assert.equal(localizedPhrase('Returns policy','ar'),'سياسة الإرجاع');
  assert.equal(localizedPhrase('Juss & Co','ja'),'Juss & Co');
  assert.equal(localizedPhrase('Public','xx'),'Public');
  assert.equal(localizedPhrase('constructor','es'),'constructor');
});
test('regional events include local national dates and US Thanksgiving',()=>{
  assert.equal(regionalEvent(new Date(2026,10,26),'US'),'thanksgiving');
  assert.equal(regionalEvent(new Date(2026,10,26),'JP'),'');
  assert.equal(regionalEvent(new Date(2026,7,15),'IN'),'national-day');
  assert.equal(regionalEvent(new Date(2026,7,15),'US'),'');
});
