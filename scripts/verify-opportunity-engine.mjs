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
    const path = await realpath(resolve(root, name));
    assert(path.startsWith(root + sep));
    assert((await stat(path)).isFile());
    res.setHeader('Content-Type', ({'.html':'text/html','.jpg':'image/jpeg','.js':'text/javascript'}[extname(path)] || 'application/octet-stream'));
    createReadStream(path).pipe(res);
  } catch { res.statusCode = 404; res.end('Not found'); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw Error('test server failed');
const url = 'http://127.0.0.1:' + address.port + '/opportunity-engine.html';
const browser = await chromium.launch({headless:true});
const testData = {
  contract:'jussco/public-opportunity-signals@v1',
  opportunities:[
    {title:'Public discovery',sources:[{title:'Sample public article lead',url:'https://news.google.com/articles/123',evidenceState:'unverified',publishedAt:'2026-11-05T18:00:00.000Z'}]},
    {title:'Workflow',sources:[]},{title:'Shopping',sources:[]}
  ]
};
try {
  for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
    const page = await browser.newPage({viewport:{width,height}});
    const errors=[];
    page.on('pageerror',(error)=>errors.push(error.message));
    await page.route('https://api.foundercontrolroom.org/public/opportunity-research/v1', async (route) =>
      route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(testData)}));
    await page.goto(url,{waitUntil:'load'});
    assert.equal(await page.locator('#cards .card').count(),3);
    assert.match(await page.locator('#status').innerText(),/No validated market ranking/i);
    await page.locator('#generate').click();
    await page.locator('#sources').click();
    await page.getByRole('link',{name:'Sample public article lead'}).waitFor();
    assert.match(await page.locator('#status').innerText(),/NOT verified demand/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth + 1),false);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(label+' Juss & Co opportunity viewer PASS');
  }
} finally {
  await browser.close();
  await new Promise((resolve,reject)=>server.close((e)=>e?reject(e):resolve()));
}
