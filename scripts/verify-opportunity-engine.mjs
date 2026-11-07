import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { stat, realpath } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = await realpath(resolve('site'));
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = await realpath(resolve(root, name));
    assert(file.startsWith(root + sep));
    assert((await stat(file)).isFile());
    res.setHeader('Content-Type', ({
      '.html':'text/html', '.jpg':'image/jpeg', '.js':'text/javascript',
      '.mjs':'text/javascript', '.css':'text/css', '.webp':'image/webp',
    })[extname(file)] || 'application/octet-stream');
    createReadStream(file).pipe(res);
  } catch { res.statusCode = 404; res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw Error('test server failed');
const url = 'http://127.0.0.1:' + address.port + '/opportunity-engine.html';
const browser = await chromium.launch({ headless:true });
const data = {
  contract:'jussco/public-opportunity-signals@v1',
  opportunities:[
    {title:'Public discovery',sources:[{title:'Sample public article lead',url:'https://news.google.com/articles/123',evidenceState:'unverified',publishedAt:'2026-11-05T18:00:00.000Z'}]},
    {title:'Workflow',sources:[]},{title:'Shopping',sources:[]},
  ],
};

try {
  for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page = await browser.newPage({viewport:{width,height},acceptDownloads:true});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://api.foundercontrolroom.org/public/opportunity-research/v1',route =>
      route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(data)}));
    await page.goto(url,{waitUntil:'load'});
    assert.equal(await page.locator('#cards .card').count(),3);
    assert.equal(await page.locator('.core .orb').count(),0,'Core is part of the clean scene, not a fake gradient orb');
    assert.match(await page.locator('.world-stage').evaluate(el => getComputedStyle(el).backgroundImage),/home-scene\.webp/);
    assert.equal(await page.evaluate(() => new Promise(resolve => {
      const image = new Image(); image.onload=()=>resolve(image.naturalWidth>0);
      image.onerror=()=>resolve(false); image.src='/assets/home-scene.webp';
    })),true,'clean environment loads');
    assert.equal(await page.locator('.opportunity-deck').isVisible(),true);
    assert.equal(await page.locator('#signals-panel').count(),1);
    assert.equal(await page.locator('#ambience-toggle').count(),1);
    assert.match(await page.locator('#status').innerText(),/unverified/i);
    await page.locator('#mission').fill('Find shopping catalog merchant opportunities using my products');
    await page.locator('#generate').click();
    assert.match(await page.locator('#cards .card').first().innerText(),/Shopping Discovery Checks/);
    await page.locator('#sources').click();
    await page.getByRole('link',{name:'Sample public article lead'}).waitFor();
    assert.match(await page.locator('#status').innerText(),/NOT verified demand/i);
    // Games integration must be discoverable without mixing with SYNC's room authority.
    const gameHubSelection=page.locator('#products input[value="Juss & Co Games / SYNC"]');
    assert.equal(await gameHubSelection.count(),1,'Game Hub is an available product');
    await page.locator('#products input').evaluateAll(inputs => {
      for(const input of inputs) input.checked=false;
    });
    await page.locator('#products summary').click();
    await gameHubSelection.check();
    await page.locator('#generate').click();
    assert.equal(await page.locator('#cards .card').count(),3);
    assert.match(await page.locator('#cards .card').first().innerText(),/SYNC Group Play Experiences/);
    assert.equal(await page.getByRole('link',{name:/Visit Game Hub/}).getAttribute('href'),'https://games.jussco.company/');
    assert.match(await page.locator('#games-entry').innerText(),/Think alike/);
    const downloadEvent=page.waitForEvent('download');
    await page.locator('#export').click();
    const download=await downloadEvent;
    assert.match(download.suggestedFilename(),/opportunity.*\.md/);
    if(label==='mobile'){
      await page.locator('#mobile-menu').click();
      assert.equal(await page.locator('#mobile-menu').getAttribute('aria-expanded'),'true');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth + 1),false);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(label+' Juss & Co Opportunity Engine: browser PASS');
  }
} finally {
  await browser.close();
  await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
}
