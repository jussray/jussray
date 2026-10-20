import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const html=readFileSync(new URL('../site/lab/index.html',import.meta.url));
const server=createServer((req,res)=>{
  if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const browser=await chromium.launch();
const errors=[];
mkdirSync('proof/lab',{recursive:true});
async function exportView(page,kind){
  const pending=page.waitForEvent('download');
  await page.locator('#export-experience').click();
  const download=await pending;
  assert.equal(download.suggestedFilename(),'jussco-'+kind+'-experience.json');
  return JSON.parse(readFileSync(await download.path(),'utf8'));
}
try{
  for(const vp of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
    const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},acceptDownloads:true});
    const page=await ctx.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base);
    assert.equal(await page.locator('#graph .node').count(),9);
    await page.screenshot({path:'proof/lab/architecture-'+vp.name+'.png',fullPage:true});
    const architecture=await exportView(page,'architecture');
    assert.equal(architecture.schema,'jussco/visual-experience/v1');
    assert.equal(architecture.items.length,9);
    assert.equal(architecture.edges.length,8);
    assert(architecture.items.every(x=>x.state==='VERIFIED_SOURCE'));
    await page.locator('#tab-playtest').click();
    await page.locator('.game[data-game="jinx"]').click();
    const playtest=await exportView(page,'playtest');
    assert.equal(playtest.items.length,5);
    assert.equal(playtest.kind,'playtest');
    assert(playtest.items.every(item=>item.state==='UNKNOWN'), 'Jungle Jinx unexecuted build/play gates must not be VERIFIED_SOURCE');
    await page.locator('.game[data-game="seek"]').click();
    const seek=await exportView(page,'playtest');
    assert.equal(seek.items[1].state,'UNKNOWN', 'Roblox ProximityPrompt live touch path remains unknown');
    assert.equal(seek.items[2].state,'VERIFIED_SOURCE', 'Documented server validation only');
    await page.locator('.game[data-game="lumora"]').click();
    const lumora=await exportView(page,'playtest');
    assert.equal(lumora.items.at(-1).state,'UNKNOWN','Unverified save/reload cannot be source-verified');
    await page.locator('.game[data-game="jinx"]').click();
    await page.screenshot({path:'proof/lab/playtest-'+vp.name+'.png',fullPage:true});
    await page.locator('#tab-canon').click();
    const canon=await exportView(page,'canon');
    assert.equal(canon.items[1].state,'BLOCKED');
    assert.equal(canon.kind,'canon');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    await ctx.close();
    console.log('PASS '+vp.name+': architecture, playtest and canon exports with evidence states');
  }
  assert.deepEqual(errors,[],'No browser JavaScript errors');
  console.log('Exact-source browser export proof PASSED');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
