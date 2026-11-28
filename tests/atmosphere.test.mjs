import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seasonFor, holidayFor, timePhase, createTimeState, solarPhase, regionalEvent, formatLocalDateTime, localizedPhrase, resolveVisitorLocale, regionForZone, createSkyState, bindPageLifecycle } from '../site/assets/atmosphere.mjs';
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

test('regional preference follows supported browser languages and known location zones',()=>{
  assert.equal(resolveVisitorLocale(['it-IT','fr-CA']).language,'fr');
  assert.equal(resolveVisitorLocale(['it-IT']).language,'en');
  assert.equal(regionForZone('Asia/Tokyo','US'),'JP');
  assert.equal(regionForZone('Australia/Darwin','GB'),'AU');
  assert.equal(regionForZone('UTC','CA'),'CA');
  assert.equal(seasonFor(new Date('2026-12-15T12:00:00Z'),'Australia/Darwin'),'summer');
  assert.equal(seasonFor(new Date('2026-02-28T23:30:00Z'),'Asia/Tokyo'),'spring');
});
test('sky holds the prior painting until the requested replacement loads',()=>{
  const displayed=[], sky=createSkyState(phase=>displayed.push(phase));
  sky.request('day'); sky.loaded('day');
  sky.request('night'); sky.loaded('sunset');
  assert.deepEqual(displayed,['day']);
  sky.request('dawn'); sky.loaded('night');
  assert.deepEqual(displayed,['day']);
  sky.loaded('dawn'); assert.deepEqual(displayed,['day','dawn']);
  sky.request('night'); assert.deepEqual(displayed,['day','dawn','night']);
});

test('visibility and page lifecycle pause and resume exactly once, even on BFCache return', () => {
  const doc = new EventTarget(); doc.hidden = false;
  const page = new EventTarget(); const calls = [];
  const dispose = bindPageLifecycle(() => calls.push('start'), () => calls.push('stop'), doc, page);
  assert.deepEqual(calls, ['start']);
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  page.dispatchEvent(new Event('pagehide'));
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
  assert.deepEqual(calls, ['start', 'stop']);
  page.dispatchEvent(new Event('pageshow')); page.dispatchEvent(new Event('pageshow'));
  assert.deepEqual(calls, ['start', 'stop', 'start']);
  dispose(); dispose(); page.dispatchEvent(new Event('pageshow'));
  assert.deepEqual(calls, ['start', 'stop', 'start', 'stop']);
});
test('initially hidden documents wait for visibility before starting', () => {
  const doc = new EventTarget(); doc.hidden = true;
  const page = new EventTarget(); let starts = 0, stops = 0;
  const dispose = bindPageLifecycle(() => starts++, () => stops++, doc, page);
  assert.equal(starts, 0);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(starts, 1);
  page.dispatchEvent(new Event('pagehide'));
  dispose(); assert.equal(stops, 1);
});
test('website and Game Hub ship identical atmosphere modules and a real home target', () => {
  const website = readFileSync(new URL('../site/assets/atmosphere.mjs', import.meta.url));
  const hub = readFileSync(new URL('../site/games/assets/atmosphere.mjs', import.meta.url));
  assert.deepEqual(website, hub);
  const html = readFileSync(new URL('../site/games/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/\bid="home"/g) || []).length, 1);
});
