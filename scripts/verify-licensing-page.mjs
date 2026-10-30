import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const types = new Map([
  ['.html','text/html; charset=utf-8'],
  ['.json','application/json; charset=utf-8'],
  ['.txt','text/plain; charset=utf-8'],
  ['.xml','application/xml; charset=utf-8'],
  ['.js','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8']
]);

const server = createServer(async (req, res) => {
  try {
    const raw = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    const rel = raw === '/' ? 'index.html' : decodeURIComponent(raw.replace(/^\//, ''));
    const safe = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
    let file = join(SITE, safe);
    const s = await stat(file).catch(() => null);
    if (s?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types.get(extname(file)) || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = 'http://127.0.0.1:' + port + '/';
const browser = await chromium.launch({ headless: true });
let failed = 0;
const say = (ok, msg) => { console.log((ok ? '✓' : '✗') + ' ' + msg); if (!ok) failed++; };

for (const vp of [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true }
]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.isMobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const response = await page.goto(base + 'licensing.html', { waitUntil: 'load' });
  say(response?.status() === 200, 'licensing: ' + vp.name + ' responds 200');
  say((await page.title()) === 'Data & AI Licensing | Juss & Co', 'licensing: ' + vp.name + ' title');
  say((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/licensing.html', 'licensing: ' + vp.name + ' canonical URL');
  say((await page.locator('a[href^="mailto:founder@jussco.company"]').count()) === 1, 'licensing: ' + vp.name + ' founder inquiry CTA');
  const body = (await page.locator('body').innerText()).toLowerCase();
  say(body.includes('never included') && body.includes('private user or customer records') && body.includes('child or teen data'), 'licensing: ' + vp.name + ' private-data exclusion visible');
  say(body.includes('public access is not a blanket license') && body.includes('written commercial permission'), 'licensing: ' + vp.name + ' rights boundary visible');
  say((await page.locator('a[href="/data/licensable-assets.json"]').count()) === 1 &&
      (await page.locator('a[href="/llms.txt"]').count()) === 1 &&
      (await page.locator('a[href="/crawlers.json"]').count()) === 1, 'licensing: ' + vp.name + ' machine-readable policy links');
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, 'licensing: ' + vp.name + ' no horizontal overflow');
  say(errors.length === 0, 'licensing: ' + vp.name + ' no console errors' + (errors.length ? ' — ' + errors.join(' | ') : ''));
  await page.screenshot({ path: 'proof/site/licensing-' + vp.name + '.png', fullPage: true });
  await ctx.close();
}
await browser.close();
server.close();
console.log(failed ? ('\n' + failed + ' licensing browser check(s) FAILED') : '\nlicensing browser proof passed');
process.exit(failed ? 1 : 0);
