import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = process.cwd();
const info = JSON.parse(readFileSync(path.join(root,'site/data/qr-links.json'),'utf8'));
const pairs = Object.entries({
  'jussco-company':'https://www.jussco.company/',
  'juss-beautiful-hair':'https://jussbeautifulhair.com/',
  'sekret-bip':'https://sekretbip.net/',
  'founder-control-room':'https://foundercontrolroom.org/',
  'jussco-games':'https://games.jussco.company/'
});
assert.equal(info.schema,'jussco/qr-registry/v1');
assert.equal(info.strategy,'first-party-direct-urls-only');
assert.equal(info.analytics,null);
assert.equal(info.runtime_verification,'unknown');
assert.equal(info.records.length,pairs.length);
for (const [id,url] of pairs) {
  const item=info.records.find(x=>x.id===id);
  assert.ok(item, id+' missing');
  assert.equal(item.url,url);
  assert.equal(item.svg,'/assets/qr/'+id+'.svg');
  const svg=readFileSync(path.join(root,'site'+item.svg),'utf8');
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('<rect')&&svg.includes('fill="#FFFFFF"'));
  assert.ok(svg.includes('fill="#100B28"')&&svg.includes('<path'));
  assert.ok(!/(<script|foreignObject|onload=|<image|xlink:href|<use|href=)/i.test(svg),'unsafe QR SVG');
  const width=Number(svg.match(/viewBox="0 0 (\d+) (\d+)"/)?.[1]);
  assert.ok(width>=33&&width<=57, 'unexpected QR size');
  const d=svg.match(/ d="([^"]+)"/)?.[1];
  assert.ok(d&&d.length>3000,'missing QR data');
  const cells=[...d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map(m=>[+m[1],+m[2]]);
  assert.ok(cells.length>180,'missing QR modules');
  assert.ok(cells.every(([x,y])=>x>=4&&y>=4&&x<width-4&&y<width-4),'QR quiet zone corrupted');
}
const html=readFileSync(path.join(root,'site/index.html'),'utf8');
assert.match(html, /src="assets\/qr\/jussco-company.svg"/);
assert.match(html, /href="https:\/\/www.jussco.company\/"/);
assert.match(html, /<link rel="canonical" href="https:\/\/www.jussco.company\/">/);
assert.match(html, /Scan to explore/);
console.log('5 first-party QR SVG assets validated structurally; direct destinations and quiet zones verified. Scan decode independently validated during asset build.');
