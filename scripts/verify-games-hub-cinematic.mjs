import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

// This serves exactly the games Worker asset directory, not the company website's assets.
const root = await realpath(resolve('site/games'));
const mime = { '.html':'text/html', '.webp':'image/webp', '.jpg':'image/jpeg', '.mjs':'text/javascript', '.css':'text/css' };
const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = await realpath(resolve(root,url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/,'')));
    if (!(path.startsWith(root+sep) || path===root) || !(await stat(path)).isFile()) throw Error('not_found');
    res.setHeader('Content-Type',mime[extname(path)] || 'application/octet-stream');
    createReadStream(path).pipe(res);
  } catch {res.statusCode=404;res.end('Not found');}
});
await new Promise(done => server.listen(0,'127.0.0.1',done));
const address=server.address();
if(!address || typeof address==='string')throw Error('test server unavailable');
const browser=await chromium.launch({headless:true});
await mkdir('proof/game-hub',{recursive:true});
try {
  for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    const response=await page.goto('http://127.0.0.1:'+address.port+'/',{waitUntil:'load'});
    assert.equal(response?.status(),200);
    assert.equal(await page.locator('#featured .featured-tile').count(),6,'six existing game identities in hub carousel');
    assert.equal(await page.locator('#games article.card').count(),6,'existing game detail cards preserved');
    assert.equal(await page.locator('#game-hub-center').count(),1,'Game Hub Center visible in hub, not a game runtime');
    assert.equal(await page.locator('#living-world-scene').count(),1,'clean cinematic world is present');
    assert.match(await page.locator('#living-world-scene').evaluate(el=>getComputedStyle(el).backgroundImage),/home-scene\.webp/);
    const imageResponse=await page.request.get('http://127.0.0.1:'+address.port+'/assets/home-scene.webp');
    assert.equal(imageResponse.status(),200,'cinematic scene is packaged with Games Worker assets');
    assert.match(imageResponse.headers()['content-type']||'',/image\/webp/);
    assert.equal(await page.locator('a[href="https://sync.jussco.company/"]').count()>0,true,'LIVE SYNC keeps its own domain');
    assert.equal(await page.locator('a[href="https://sync.jussco.company/chat/"]').count()>0,true,'Chat SYNC retains its own edition URL');
    assert.equal(await page.locator('a[href="https://sync-playtest.lovable.app/"]').count()>0,true,'Lovable SYNC remains separate');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
    assert.equal(await page.locator('#ambient-toggle').getAttribute('aria-pressed'),'false','audio off initially');
    assert.deepEqual(errors,[],'no page script errors');
    if(label==='mobile'){
      const menu=page.locator('#mobile-menu');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'),'true','mobile nav opens');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'),'false','Escape closes mobile navigation');
      assert.equal(await page.locator('#game-hub-center').isVisible(),false,'Game Hub Center details start closed on mobile');
      const hubToggle=page.locator('#game-hub-toggle');
      assert.equal(await hubToggle.getAttribute('aria-expanded'),'false','mobile Game Hub Center exposes closed state');
      await hubToggle.click();
      assert.equal(await hubToggle.getAttribute('aria-expanded'),'true','Game Hub Center opens on demand');
      assert.equal(await page.locator('#game-hub-center').isVisible(),true,'Game Hub Center details are accessible after opening');
      assert.equal(await page.locator('#games .cards').isVisible(),false,'long game descriptions remain collapsed initially');
      await page.locator('#game-hub-center a[href="#games"]').click();
      assert.equal(await page.locator('#games .cards').isVisible(),true,'All Games opens the full collection');
      const track=page.locator('#featured-track');
      assert.equal(await track.evaluate(el=>el.scrollWidth>el.clientWidth+5),true,'mobile feature cards scroll horizontally');
      await page.locator('#featured-next').click();
      await page.waitForTimeout(200);
      assert.equal(await track.evaluate(el=>el.scrollLeft>0),true,'carousel next control reveals more games');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'mobile interactions never create horizontal overflow');
    }
    await page.screenshot({path:'proof/game-hub/'+label+'.png',fullPage:false});
    await page.close();
    console.log('PASS Juss & Co Games hub '+label+': site world, game isolation, assets and interactions');
  }
} finally {
  await browser.close();
  await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
}