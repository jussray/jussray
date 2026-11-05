// Browser contract for the Juss & Co seasonal glass-scroll atmosphere.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../site/', import.meta.url).pathname;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); res.end(); return; }
  const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(resolve(root) + sep) || !existsSync(path)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise(resolve => srv.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const origin = 'http://127.0.0.1:' + srv.address().port;
  await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
  await page.locator('#atmosphereButton').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#stars').evaluate(el => el.parentElement === document.body), true, 'stars must not be clipped to hero');
  assert.equal(await page.locator('#stars').evaluate(el => getComputedStyle(el).position), 'fixed', 'star canvas must remain fixed during scroll');
  await page.locator('#atmosphereButton').click();
  assert.equal(await page.locator('#atmospherePanel').isVisible(), true);
  await page.locator('#atmosphereSeason').selectOption('winter');
  assert.equal(await page.locator('body').getAttribute('data-season'), 'winter');
  await page.locator('#atmosphereMotion').check();
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('atmosphere-calm')), true);
  assert.equal(await page.locator('#stars').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page.locator('body').getAttribute('data-season'), 'winter', 'explicit preferences must survive reload');
  await page.locator('#atmosphereButton').click();
  await page.locator('#atmosphereSeason').selectOption('auto');
  assert.match(await page.locator('body').getAttribute('data-season'), /^(spring|summer|autumn|winter)$/);
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, 'mobile viewport must not overflow horizontally');
  assert.equal(await page.locator('a[href="/services.html"]').count() > 0, true, 'existing business routes must remain intact');
  console.log('PASS: Juss & Co adaptive atmosphere, persistence, motion, fixed stars, mobile, and routes');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => srv.close(resolve));
}
