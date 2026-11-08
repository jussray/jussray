import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { chromium } from 'playwright';

// A source/asset smoke test, NOT a production deployment or physical GPU test.
// The worker config serves the existing site/games asset directory. Keep hub intact.
const config = JSON.parse(await readFile('wrangler.games.jsonc', 'utf8'));
assert.equal(config.name, 'jussco-games');
assert.equal(config.assets?.directory, './site/games');
const assetRoot = await realpath(resolve('site/games'));
const gameFile = resolve(assetRoot, 'steel-city/index.html');
assert.equal((await stat(gameFile)).isFile(), true);
const game = await readFile(gameFile, 'utf8');
assert.match(game, /const sagaStages\s*=/);
assert.match(game, /const sagaNeighbors\s*=/);
assert.match(game, /__steelCityDebug/);
assert.ok(game.length > 100_000, 'unexpected truncated game source');

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    const relative = path === '/' ? 'index.html' : path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1);
    const full = await realpath(resolve(assetRoot, relative));
    if (!full.startsWith(`${assetRoot}${sep}`) || !(await stat(full)).isFile()) throw Error('not_found');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
    res.end(await readFile(full));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});
await new Promise((done, reject) => server.once('error', reject).listen(0, '127.0.0.1', done));
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const [label, width, height] of [['desktop', 1280, 760], ['mobile-emulated', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const hub = await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    assert.equal(hub?.status(), 200, 'existing Games Hub route regressed');
    assert.match(await page.title(), /Juss.*Co.*Games/i);
    const response = await page.goto(`http://127.0.0.1:${port}/steel-city/`, { waitUntil: 'domcontentloaded' });
    assert.equal(response?.status(), 200, 'Steel City preview route unavailable');
    await page.waitForFunction(() => typeof window.__steelCityDebug === 'function');
    let status = await page.evaluate(() => window.__steelCityDebug());
    assert.equal(status.started, false);
    assert.equal(status.campaignStage, 0);
    await page.locator('#playMuted').click();
    await page.locator('#storyOpen').click();
    assert.equal(await page.locator('.storyAct').count(), 7);
    await page.locator('#storyClose').click();
    await page.locator('#storyRoute').click();
    await page.keyboard.press('e');
    await page.waitForTimeout(90);
    status = await page.evaluate(() => window.__steelCityDebug());
    assert.equal(status.campaignStage, 1, 'story route failed');
    await page.keyboard.press('f');
    assert.equal((await page.evaluate(() => window.__steelCityDebug())).skyMode, true);
    await page.locator('#restart').click();
    status = await page.evaluate(() => window.__steelCityDebug());
    assert.equal(status.campaignStage, 0);
    assert.equal(status.skyMode, false);
    assert.deepEqual(errors, [], 'browser JavaScript error');
    console.log(`PASS ${label}: hub + /steel-city/ HTTP, story start, flight, reset, no JS errors; WebGL=${status.webgl}`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
console.log('Steel City preview source/asset test passed. No live route or hardware WebGL claims.');