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
await mkdir('proof/site',{recursive:true});
try {
  for(const [label,width,height] of [['desktop',1440,900],['laptop',1280,720],['mobile',390,844],['compact',360,667]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    const response=await page.goto('http://127.0.0.1:'+address.port+'/',{waitUntil:'load'});
    assert.equal(response?.status(),200);
    assert.equal(await page.locator('#featured .featured-tile').count(),10,'six game worlds plus Se’kret Bip, StoryEngine, Founder Control Room and PromptOS (founder: actual games and apps)');
    assert.deepEqual(await page.locator('#featured .featured-tile').evaluateAll(els=>els.slice(0,3).map(el=>el.querySelector('strong')?.textContent?.trim())),['SYNC','LUMORA','ChatQuest'],'first three cards match the founder Game Hub mockups');
    assert.equal(await page.locator('#featured .featured-icon svg').count(),10,'every featured world has its glowing art (founder v3 mockups)');
    assert.deepEqual(await page.locator('#featured .featured-tile small').allTextContents(),['Group play · Live','In development','In development','In development','In development','Private prototype','Opening soon','Building','Building','Building'],'featured statuses match the founder mockups');
    assert.equal(await page.locator('#games article.card').count(),6,'existing game detail cards preserved');
    assert.equal(await page.locator('#games article.card:has(.tag.wait) a').count(),0,'unreleased game cards have no public play links');
    assert.equal(await page.locator('.header-tools .utility').evaluateAll(nodes=>nodes.filter(el=>getComputedStyle(el).display!=='none').every(el=>{const box=el.getBoundingClientRect();return box.width>=44&&box.height>=44;})),true,'header tools meet 44px touch targets');
    assert.equal(await page.locator('#game-hub-center').count(),1,'Game Hub Center visible in hub, not a game runtime');
    assert.equal(await page.locator('#living-world-scene').count(),1,'clean cinematic world is present');
    assert.equal(await page.locator('#hub-lotus').count(),1,'decorative lotus sculpture is present without changing game identity');
    assert.equal(await page.locator('#site-nav a[aria-current="page"]').textContent(),'Products','Game Hub sits under Products, per founder v3 mockups');
    assert.equal(await page.locator('.skip-link').getAttribute('href'),'#main','keyboard users have a content bypass');
    assert.deepEqual(await page.locator('#game-hub-center a').evaluateAll(a=>a.map(x=>x.getAttribute('href'))),['#games','#sync-world'],'Game Hub Center links only to real destinations');
    assert.equal(await page.locator('#game-hub-center button.soon').count(),4,'Tournaments, Events, Creator Zone and Rewards are shown as coming soon, not as live features');
    assert.equal(await page.locator('#featured .tile-storyengine a, a.tile-storyengine').count(),0,'StoryEngine has no public product link until its front door is live');
    assert.deepEqual(await page.locator('a.tile-fcr, a.tile-promptos').evaluateAll(a=>a.map(x=>x.getAttribute('href'))),['https://foundercontrolroom.org','https://github.com/jussray/promptos'],'FCR and PromptOS use their founder-declared links from worlds.json');
    assert.equal(await page.locator('#current-season').textContent(),'Sunset','hub opens on the mockup Sunset atmosphere');
    await page.locator('#library-btn').click();
    assert.match(await page.locator('#hub-toast').innerText(),/coming soon/i,'My Library honestly reports coming soon');
    assert.match(await page.locator('#living-world-scene').evaluate(el=>getComputedStyle(el).backgroundImage),/home-scene\.webp/);
    const imageResponse=await page.request.get('http://127.0.0.1:'+address.port+'/assets/home-scene.webp');
    assert.equal(imageResponse.status(),200,'cinematic scene is packaged with Games Worker assets');
    assert.match(imageResponse.headers()['content-type']||'',/image\/webp/);
    assert.equal(await page.locator('a[href="https://sync.jussco.company/"]').count()>0,true,'LIVE SYNC keeps its own domain');
    assert.equal(await page.locator('a[href="https://sync.jussco.company/chat/"]').count()>0,true,'Chat SYNC retains its own edition URL');
    assert.equal(await page.locator('a[href="https://sync-playtest.lovable.app/"]').count()>0,true,'Lovable SYNC remains separate');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
    assert.equal(await page.locator('#ambient-toggle').getAttribute('aria-pressed'),'false','audio off initially');
    await page.screenshot({path:'proof/site/game-hub-'+label+'-initial.png',fullPage:false});
    {
    await page.locator('#search-toggle').click();
    assert.equal(await page.locator('#search-toggle').getAttribute('aria-expanded'),'true','search exposes expanded state');
    await page.locator('#game-search').fill('LUMORA');
    assert.equal(await page.locator('#games article.card:visible').count(),1,'search reveals matching game even on a collapsed mobile collection');
    assert.match(await page.locator('#search-status').innerText(),/1 game found/,'search announces the match count accessibly');
    assert.equal(await page.locator('#search-view').isVisible(),true,'search provides a jump to visible matches');
    await page.locator('#game-search').fill('promptos');
    assert.equal(await page.locator('#search-apps a[href="https://github.com/jussray/promptos"]').count(),1,'search also finds Juss & Co apps on the featured row');
    await page.locator('#game-search').fill('storyengine');
    assert.equal(await page.locator('#search-apps a').count(),0,'StoryEngine shows in search without a link');
    assert.equal(await page.locator('#search-apps span').count(),1,'StoryEngine is listed as text only');
    await page.locator('#game-search').fill('game-title-that-does-not-exist');
    assert.equal(await page.locator('#games article.card:visible').count(),0,'unknown games have no false matches');
    assert.match(await page.locator('#search-status').innerText(),/No games found/,'empty results are announced');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#search-panel').isVisible(),false,'Escape closes search');
    assert.equal(await page.locator('#games article.card[hidden]').count(),0,'Escape restores all game listings');
    }
    assert.equal(await page.locator('#games .cards').isVisible(),false,'every width lands on the one-screen hub');
    assert.equal(await page.locator('html').getAttribute('data-hub-view'),'home','hub lands on its one-screen view at every width');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'hub landing has no vertical scrolling at '+label);
    assert.deepEqual(errors,[],'no page script errors');
    if(width<=800){
      assert.equal(await page.locator('html').getAttribute('data-hub-view'),'home','mobile lands on the one-screen hub');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'landing has no vertical scrolling');
      assert.equal(await page.locator('#hub-bottom-nav a').count(),5,'all five company page destinations are available');
      assert.equal(await page.locator('#ambient-mobile-mount #ambience').count(),1,'ambience stays on screen');
      assert.equal(await page.locator('#games').isVisible(),false,'game details do not extend the landing');
      assert.equal(await page.locator('#hub-lotus').isVisible(),true,'illuminated lotus is visible on phone landing');
      const menu=page.locator('#mobile-menu');
      await menu.click();
      assert.equal(await menu.getAttribute('aria-expanded'),'true','mobile nav opens');
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'),'false','Escape closes mobile navigation');
      assert.equal(await page.locator('#game-hub-center').isVisible(),false,'Game Hub Center details start closed on mobile');
      const track=page.locator('#featured-track');
      const metrics=await track.evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,display:getComputedStyle(el).display,tiles:el.children.length}));
      assert.equal(metrics.clientWidth<=width-24,true,'featured viewport stays within the phone screen: '+JSON.stringify(metrics));
      assert.equal(metrics.scrollWidth>metrics.clientWidth+5,true,'featured tiles scroll horizontally: '+JSON.stringify(metrics));
      assert.equal(await track.evaluate(el=>el.children[2].getBoundingClientRect().right<=el.getBoundingClientRect().right+1),true,'three featured destinations fit on initial phone screen');
      assert.equal(await track.evaluate(el=>el.children[3].getBoundingClientRect().left>=el.getBoundingClientRect().right-1),true,'fourth featured destination requires horizontal swipe');
      await page.locator('#featured-next').click();
      await page.waitForTimeout(200);
      assert.equal(await track.evaluate(el=>el.scrollLeft>0),true,'next reveals more featured tiles');
      assert.equal(await page.locator('#game-hub-toggle').isVisible(),true,'phone landing shows the Game Hub Center pill (founder v3 phone mockup)');
      assert.equal(await page.locator('#ambient-mobile-mount #ambience').isVisible(),true,'phone landing shows ambience and atmosphere (founder v3 phone mockup)');
      await page.evaluate(()=>{location.hash='games';});
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='details');
      const hubToggle=page.locator('#game-hub-toggle');
      assert.equal(await hubToggle.isVisible(),true,'details view keeps the Game Hub Center pill');
      assert.deepEqual(await page.locator('.hub-quick > *').allTextContents(),['All Games','Tournaments','Events','Creator Zone'],'hub shortcuts match the founder v3 phone mockup');
      assert.equal(await hubToggle.getAttribute('aria-expanded'),'false','mobile Game Hub Center exposes closed state');
      await hubToggle.click();
      assert.equal(await hubToggle.getAttribute('aria-expanded'),'true','Game Hub Center opens on demand');
      assert.equal(await page.locator('#game-hub-center').isVisible(),true,'Game Hub Center details are accessible after opening');
      await page.locator('#game-hub-center a[href="#games"]').click();
      await page.locator('#games .cards').waitFor({state:'visible'});
      assert.equal(await page.locator('html').getAttribute('data-hub-view'),'details','All Games has its own detail view');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'game details have no horizontal overflow');
      await page.locator('#details-back').click();
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='home');
      assert.equal(await page.locator('html').getAttribute('data-hub-view'),'home','back opens the no-scroll landing');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'landing still fits after return');
      await page.locator('#featured .featured-tile').nth(1).click();
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='details');
      assert.equal(await page.evaluate(()=>location.hash),'#lumora-world','featured world shortcut enters an existing upcoming game');
      assert.equal(await page.locator('#lumora-world').isVisible(),true,'upcoming game details are shown');
      assert.equal(await page.locator('#lumora-world a').count(),0,'unreleased world never gets a public play link');
      await page.locator('#details-back').click();
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='home');
      await page.locator('#featured .featured-tile').nth(0).click();
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='details');
      assert.equal(await page.locator('#sync-world .edition a').count(),3,'SYNC detail view retains all three actual destinations');
      await page.locator('#details-back').click();
      await page.waitForFunction(()=>document.documentElement.dataset.hubView==='home');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'featured and SYNC navigation preserve no-scroll landing');
    }
    await page.screenshot({path:'proof/site/game-hub-'+label+'.png',fullPage:false});
    await page.close();
    console.log('PASS Juss & Co Games hub '+label+': site world, game isolation, assets and interactions');
  }
} finally {
  await browser.close();
  await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
}