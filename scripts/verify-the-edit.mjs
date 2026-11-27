import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const html = await readFile(new URL('../site/the-edit.html', import.meta.url), 'utf8');
const scene = await readFile(new URL('../site/assets/home-scene.webp', import.meta.url));
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if(url.origin==='https://editorial.test' && url.pathname==='/the-edit.html') return route.fulfill({contentType:'text/html',body:html});
    if(url.origin==='https://editorial.test' && url.pathname==='/assets/home-scene.webp') return route.fulfill({contentType:'image/webp',body:scene});
    return route.abort();
  });
  await page.goto('https://editorial.test/the-edit.html');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').innerText(),'THE WORK,\nIN FOCUS.');
  assert.equal(await page.locator('.editorial').count(),3);
  assert.equal(await page.locator('.scene').evaluate(el=>getComputedStyle(el).animationName),'none');
  await mkdir('proof/site',{recursive:true});
  await page.screenshot({path:'proof/site/the-edit-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile must not overflow');
  await page.screenshot({path:'proof/site/the-edit-mobile.png',fullPage:true});
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.scene').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await page.locator('.masthead nav').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).color),'rgb(23, 19, 28)');
  for(const section of await page.locator('.editorial').all()) {
    assert.equal(await section.evaluate(el=>getComputedStyle(el).breakInside),'avoid');
    assert.ok(await section.isVisible());
  }
  const pdf=await page.pdf({path:'proof/site/the-edit-print.pdf',format:'Letter',printBackground:false});
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  assert.ok(pdf.length>1000);
  console.log('Editorial Chromium checks passed: desktop, mobile, print CSS and PDF bytes (offline fonts fallback).');
} finally { await browser.close(); }
