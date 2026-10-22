import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const code = readFileSync(new URL('../site/assets/conversion-tracking.js', import.meta.url), 'utf8');
function boot({ gpc = false, dnt = '0', track = () => {}, noZaraz = false } = {}) {
  const listeners = [];
  const win = { location: { href: 'https://www.jussco.company/' }, doNotTrack: '0' };
  if (!noZaraz) win.zaraz = { track };
  const doc = { addEventListener(type, fn, opts) { listeners.push({ type, fn, opts }); } };
  runInNewContext(code, { window: win, document: doc, navigator: { globalPrivacyControl: gpc, doNotTrack: dnt }, URL });
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0].type, 'click');
  assert.equal(listeners[0].opts.passive, true);
  return { click(target) { listeners[0].fn({ target }); } };
}
function target({ href = null, className = '', copy = false, world = false } = {}) {
  const anchor = href === null ? null : {
    getAttribute(name) { return name === 'href' ? href : null; },
    matches(selector) { return (selector === '.os-link' && className === 'os-link') || (selector === '#dCta a' && className === 'world-cta'); }
  };
  return { closest(selector) {
    if (selector === '#copyBtn') return copy ? {} : null;
    if (selector === 'a[href]') return anchor;
    if (selector === '#worlds .card') return world ? {} : null;
    return null;
  }};
}

test('classifies observed company-front-door intent with no personal fields', () => {
  const calls = [];
  const site = boot({ track: (name, props) => calls.push({ name, props }) });
  site.click(target({ href: 'mailto:person+private@example.com' }));
  site.click(target({ copy: true }));
  site.click(target({ world: true }));
  site.click(target({ href: 'https://truthweaver.jussco.company/', className: 'os-link' }));
  site.click(target({ href: 'https://games.jussco.company/' }));
  site.click(target({ href: 'https://jussbeautifulhair.com/shop', className: 'world-cta' }));
  site.click(target({ href: 'https://sekretbip.net/', className: 'world-cta' }));
  assert.deepEqual(calls.map(x => x.name), ['contact_click','contact_click','world_detail_open','app_open','app_open','shop_click','project_open']);
  assert.deepEqual([...new Set(calls.map(x => x.props.project))], ['juss-and-co']);
  assert.equal(calls.every(x => Object.keys(x.props).sort().join(',') === 'action,project,schema,surface'), true);
  assert.equal(JSON.stringify(calls).includes('person+private'), false);
  assert.equal(JSON.stringify(calls).includes('truthweaver.jussco.company'), false);
});

test('supports general contact methods without leaking destinations', () => {
  const calls=[];const site=boot({track:(name,props)=>calls.push({name,props})});
  site.click(target({href:'tel:+123456789'}));
  site.click(target({href:'https://wa.me/2349135081096?text=private'}));
  site.click(target({href:'https://jussbeautifulhair.com.evil.example'}));
  site.click(target({href:'javascript:alert(1)'}));
  assert.deepEqual(calls.map(x=>x.name), ['call_click','whatsapp_click']);
  assert.equal(JSON.stringify(calls).includes('2349135081096'), false);
});

test('respects browser GPC and do-not-track flags', () => {
  for (const option of [{gpc:true},{dnt:'1'}]) {
    const calls=[];const site=boot({...option,track:(...x)=>calls.push(x)});
    site.click(target({href:'mailto:founder@jussco.company'}));
    assert.equal(calls.length,0);
  }
});

test('analytics unavailability or exception cannot break clicks', () => {
  boot({noZaraz:true}).click(target({copy:true}));
  boot({track:()=>{throw Error('offline')}}).click(target({copy:true}));
  boot({track:()=>Promise.reject(Error('offline'))}).click(target({copy:true}));
  boot().click({});
});
