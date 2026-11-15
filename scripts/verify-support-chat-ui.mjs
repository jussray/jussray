// Exact-source Playwright check of the public chat shell (API stubbed, not an AI-production claim).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.webp':'image/webp' };
const server = createServer((request, response) => {
  const path = decodeURIComponent(request.url.split('?')[0]);
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  if (!existsSync(file)) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, {'content-type': MIME[extname(file)] || 'application/octet-stream'});
  response.end(readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
mkdirSync('proof/site',{recursive:true});
const browser=await chromium.launch();
let bad=0;
try {
  for (const viewport of [{width:1440,height:900,label:'desktop'},{width:390,height:844,label:'mobile'}]) {
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.route('**/api/support-chat',route=>route.fulfill({
      status:200,contentType:'application/json',
      body:JSON.stringify({answer:'Here are our services.',links:[{label:'Explore solutions',url:'https://www.jussco.company/services.html'}]})
    }));
    await page.goto(origin+'/',{waitUntil:'load'});
    const launcher=page.locator('#jc-chat-launcher');
    await launcher.waitFor({state:'visible'});
    await launcher.click();
    if (!(await page.locator('#jc-chat-panel').isVisible())) bad++;
    await page.locator('.jc-chat__input').fill('What services do you offer?');
    await page.locator('.jc-chat__send').click();
    await page.getByText('Here are our services.').waitFor({state:'visible'});
    if ((await page.locator('.jc-chat__links a[href="https://www.jussco.company/services.html"]').count())!==1) bad++;
    if (await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth+1)) bad++;
    await page.screenshot({path:'proof/site/support-chat-'+viewport.label+'.png'});
    await page.keyboard.press('Escape');
    if (await page.locator('#jc-chat-panel').isVisible()) bad++;
    if (errors.length) { console.error(errors.join('\n')); bad++; }
    console.log('support-chat '+viewport.label+': '+(bad?'CHECK':'OK'));
    await page.close();
  }
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
if (bad) process.exit(1);
