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
assert.match(game, /id="moveJoystick"/);
assert.match(game, /graphicsRevision:'cinematic-geometry-v2'/);
assert.match(game, /STEEL CITY VISUAL RUNTIME/);
assert.match(game, /function vehicle\(x,z,color\)/);
assert.match(game, /assets\/pittsburgh-night-skyline\.jpg/);
assert.doesNotMatch(game, /id="(?:up|down|left|right)"/);
const artFile = resolve(assetRoot, 'steel-city/assets/pittsburgh-night-skyline.jpg');
const embedded = game.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/);
assert.ok(embedded, 'approved art source missing');
assert.deepEqual(await readFile(artFile), Buffer.from(embedded[1], 'base64'), 'production graphics asset differs from approved image');
assert.ok(game.length > 100_000, 'unexpected truncated game source');

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    const relative = path === '/' ? 'index.html' : path.endsWith('/') ? `${path.slice(1)}index.html` : path.slice(1);
    const full = await realpath(resolve(assetRoot, relative));
    if (!full.startsWith(`${assetRoot}${sep}`) || !(await stat(full)).isFile()) throw Error('not_found');
    res.writeHead(200, { 'Content-Type': relative.endsWith('.jpg') ? 'image/jpeg' : 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
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
    await page.waitForFunction(() => document.getElementById('skyBackdrop')?.dataset.graphicsAsset === 'loaded', { timeout: 15_000 });
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
    if (label === 'mobile-emulated') {
      assert.equal(await page.locator('#jump2').isVisible(), true, 'jump control hidden behind canvas');
      const bounds = await page.locator('#moveJoystick').boundingBox();
      assert.ok(bounds && bounds.width > 100, 'joystick touch target missing');
      const initial = await page.evaluate(() => window.__steelCityDebug());
      await page.mouse.move(bounds.x + bounds.width * .82, bounds.y + bounds.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(550);
      const steered = await page.evaluate(() => window.__steelCityDebug());
      await page.mouse.up();
      assert.ok(steered.x - initial.x > 1.0, 'joystick did not move player');
      assert.ok(Math.abs(steered.cameraYaw - initial.cameraYaw) > .4, 'camera did not rotate toward joystick');
      assert.equal(await page.evaluate(() => window.__steelJoystick.active), false, 'joystick remained stuck after release');
    }
    assert.deepEqual(errors, [], 'browser JavaScript error');
    console.log(`PASS ${label}: hub + /steel-city/ HTTP, story start, flight, reset, no JS errors; WebGL=${status.webgl}`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
console.log('Steel City preview source/asset test passed. No live route or hardware WebGL claims.');