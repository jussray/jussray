// Exact-source Playwright proof for the Juss & Co site. Production reachability belongs to verify-provider-site.mjs.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.txt': 'text/plain', '.xml': 'application/xml' };
const WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);
const CONNECTOR_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/connectors.json'), 'utf8')); const EXPECTED_CONNECTORS = CONNECTOR_REGISTRY.lanes.map((x) => x.name);
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = join(ROOT, p); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const url = `http://127.0.0.1:${srv.address().port}/`;
mkdirSync('proof/site', { recursive: true });
const browser = await chromium.launch(); let failed = 0; const say = (ok, m) => { console.log(`${ok ? 'ok ' : 'FAIL'} ${m}`); if (!ok) failed++; };
const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
say(/User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots) && robots.includes('https://www.jussco.company/sitemap.xml'), 'seo: robots allows crawl and declares canonical sitemap');
say(['https://www.jussco.company/','https://www.jussco.company/services.html','https://www.jussco.company/work.html','https://www.jussco.company/creative-history.html','https://www.jussco.company/games/'].every((x) => sitemap.includes(`<loc>${x}</loc>`)), 'seo: sitemap lists canonical public pages');
const expectedOS = ['Truth Weaver', 'Truth Compass', 'Exact Match Engine', 'Living Truth', 'Proof Core'];
// Browser receipt: verify the actual HTML script attaches and emits fixed, non-personal fields.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    window.__jcConversionEvents = [];
    window.zaraz = { track(name, properties) { window.__jcConversionEvents.push({ name, properties }); } };
  });
  const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url, { waitUntil: 'load' });
  await page.locator('#copyBtn').click();
  await page.locator('.card').nth(3).click();
  const receipt = await page.evaluate(() => window.__jcConversionEvents);
  say(JSON.stringify(receipt.map((x) => x.name)) === JSON.stringify(['contact_click', 'world_detail_open']),
    'conversion browser: copy contact and world card emit exact intended events');
  say(receipt.length === 2 && receipt.every((x) => x.properties.project === 'juss-and-co' &&
    Object.keys(x.properties).sort().join(',') === 'action,project,schema,surface'),
    'conversion browser: fixed anonymized event properties');
  say(errors.length === 0, 'conversion browser: tracking causes no page errors');
  await ctx.close();
}
for (const mode of ['abort', 'malformed']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/data/connectors.json', (r) => mode === 'abort'
    ? r.abort()
    : r.fulfill({ status: 200, contentType: 'application/json', body: '{not json' }));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5, null, { timeout: 5000 });
  const osCardCount = await page.locator('.os-card').count();
  const connectorClaimCount = await page.locator('.os-connectors').count();
  say(osCardCount === 5, `isolation: connectors.json ${mode} still renders 5 OS cards`);
  say(connectorClaimCount === 0, `isolation: connectors.json ${mode} renders no connector claims`);
  await ctx.close();
}
// Outcome Edit: no unapproved, wrong-destination, or unproven stories may render.
for (const mode of ['empty', 'mixed', 'unavailable']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/data/approved-stories.json', (route) => {
    if (mode === 'unavailable') return route.abort();
    const stories = mode === 'empty' ? [] : [
      { title: 'Unapproved', summary: 'Hidden', project: 'Test', proofUrl: 'https://example.org/proof', destination: 'jussco.company', approved: false, publicationApproved: true },
      { title: 'Wrong destination', summary: 'Hidden', project: 'Test', proofUrl: 'https://example.org/proof', destination: 'other.example', approved: true, publicationApproved: true },
      { title: 'No public proof', summary: 'Hidden', project: 'Test', destination: 'jussco.company', approved: true, publicationApproved: true },
      { title: 'Approved test fixture', summary: 'Public test only', project: 'Test', proofUrl: 'https://example.org/proof', destination: 'jussco.company', approved: true, publicationApproved: true }
    ];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ schema: 'jussco/approved-stories@v1', stories }) });
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const titles = await page.locator('#outcome-stories h3').allTextContents();
  say(JSON.stringify(titles) === JSON.stringify(mode === 'mixed' ? ['Approved test fixture'] : []), `outcomes: ${mode} publication filter`);
  say(await page.locator('#outcome-empty').isVisible() === (mode !== 'mixed'), `outcomes: ${mode} empty state`);
  await ctx.close();
}
for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'tablet', w: 834, h: 1112, m: true }, { n: 'mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); // Chromium may abort a non-blocking keepalive POST when this test closes the page; only that exact abort is excluded.
  page.on('requestfailed', (r) => { const abortedTelemetry = new URL(r.url()).pathname === '/_telemetry/v1' && r.failure()?.errorText === 'net::ERR_ABORTED'; if (!abortedTelemetry && !/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);
  say((await page.locator('link[rel="canonical"]').count()) === 1 && (await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/', `${vp.n}: exactly one preferred www canonical tag`);
  say((await page.title()) === 'Juss & Co | Juss Rayy, Product & AI Systems Builder', `${vp.n}: search title binds Juss & Co to Juss Rayy`);
  say((await page.locator('meta[name="description"]').getAttribute('content'))?.includes("Juss Rayy's founder studio"), `${vp.n}: meta description names founder and studio`);
  say((await page.locator('meta[property="og:url"]').getAttribute('content')) === 'https://www.jussco.company/' && (await page.locator('meta[property="og:image"]').getAttribute('content')) === 'https://www.jussco.company/assets/hero.jpg', `${vp.n}: absolute canonical social metadata`);
  say((await page.locator('meta[name="twitter:card"]').getAttribute('content')) === 'summary_large_image', `${vp.n}: twitter card metadata`);
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const schemaTypes = (schema['@graph'] || []).map((x) => x['@type']);
  say(['Person','Organization','WebSite'].every((x) => schemaTypes.includes(x)), `${vp.n}: Person Organization WebSite structured data`);
  say(/Juss Rayy/.test(await page.locator('.founder-line').innerText()) && /Full-Stack AI Systems Builder/.test(await page.locator('.founder-line').innerText()), `${vp.n}: visible founder identity`);
  say((await page.locator('a[href="/services.html"]').count()) >= 3, `${vp.n}: Work with Juss path linked from homepage`);
  say((await page.locator('a[href="/work.html"]').count()) >= 2, `${vp.n}: Selected Work path linked from homepage`);
  const portfolioDownload = page.locator('#portfolioDownload');
  say(await portfolioDownload.count() === 1, `${vp.n}: The Why has exactly one portfolio download button`);
  say(await portfolioDownload.getAttribute('href') === 'https://github.com/jussray/jussray/raw/refs/heads/main/AI_EVALUATION_PORTFOLIO_PACKET.md' &&
    await portfolioDownload.getAttribute('target') === '_blank' &&
    (await portfolioDownload.getAttribute('rel'))?.split(/\s+/).includes('noopener') &&
    (await portfolioDownload.getAttribute('rel'))?.split(/\s+/).includes('noreferrer'),
    `${vp.n}: portfolio packet link opens in a safe new tab`);
  say((await portfolioDownload.innerText()).includes('Download my portfolio packet') && await portfolioDownload.isVisible(),
    `${vp.n}: portfolio download button is visible and accurately labeled`);
  const companyEmail=await page.locator('#mail').textContent();
  say(companyEmail==='founder@jussco.company' && (await page.locator('#mail').getAttribute('href'))==='mailto:'+companyEmail, `${vp.n}: company email text and mailto match business address`);
  const directory=page.locator('#projectContactDirectory');
  await directory.waitFor({state:'visible',timeout:5000});
  say(await directory.isVisible(), `${vp.n}: per-project contact directory available`);
  await directory.locator('summary').click();
  const routes=await page.locator('#projectContactList li').evaluateAll(nodes=>nodes.map(li=>({name:li.querySelector('strong')?.textContent,href:li.querySelector('a')?.getAttribute('href'),text:li.querySelector('a')?.textContent,shared:li.querySelector('small')?.textContent||''})));
  const byName=Object.fromEntries(routes.map(r=>[r.name,r]));
  say(routes.length===EXPECTED_WORLDS.length, `${vp.n}: every world has a discoverable project contact`);
  say(byName['Founder Control Room']?.href==='mailto:support@foundercontrolroom.org' && byName['Juss Beautiful Hair']?.href==='mailto:support@jussbeautifulhair.com' && byName["Se'kret Bip"]?.href==='mailto:founder@sekretbip.net' && byName['Bip Jr']?.href==='mailto:support@sekretbip.net', `${vp.n}: domain-specific FCR, hair and Bip routing preserved`);
  say(routes.every(r=>r.href==='mailto:'+r.text && !r.href.includes('[')) && !routes.some(r=>r.name!=='Juss Beautiful Hair' && r.href.endsWith('@jussbeautifulhair.com')), `${vp.n}: project emails have matching mailto and no hair-store leakage`);
  say(byName['StoryEngine']?.href==='mailto:support@jussco.company' && byName['StoryEngine']?.shared.includes('Shared'), `${vp.n}: projects without proven mailboxes show shared company support`);

  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say(await page.evaluate(() => document.querySelector('.top .brand').getBoundingClientRect().height <= 44), `${vp.n}: header wordmark stays on one line`);
  say(await page.evaluate(() => document.querySelector('.top .btn').getBoundingClientRect().right <= window.innerWidth - 16), `${vp.n}: header CTA stays inside the side gutter`);
  if (vp.n === 'mobile') say(await page.evaluate(() => document.querySelector('.hero .eyebrow').getBoundingClientRect().top >= document.querySelector('.hero .hero-bg').getBoundingClientRect().bottom), 'mobile: hero eyebrow sits below the art band');
  say((await page.$$('.card')).length === EXPECTED_WORLDS.length, `${vp.n}: ${EXPECTED_WORLDS.length} portfolio worlds`);
  say((await page.locator('.os-card').count()) === 5, `${vp.n}: five public standalone OS builds`);
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.os-card h3')].map((e) => e.textContent))) === JSON.stringify(expectedOS), `${vp.n}: standalone OS identities preserved`);
  const worldNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));
  say(['Bip Jr','PromptOS','SolContinuity','Untold Stories','SWEATS','SleepWealth Agent','Think Tank','Alexa Commerce Engine','Ayure'].every((n) => worldNames.includes(n)), `${vp.n}: remaining portfolio worlds render`);
  say((await page.innerText('#filters .chip[data-group=""] .n')) === String(EXPECTED_WORLDS.length).padStart(2,'0'), `${vp.n}: world count follows registry`);
  say((await page.locator('#worldSummaryCount').innerText()) === `${EXPECTED_WORLDS.length} worlds. One shared belief.`, `${vp.n}: public world summary follows registry`);
  say((await page.locator('.os-card').count()) === 5, `${vp.n}: five public standalone OS builds`);
  say(/legal-navigation and notice-research product/i.test(await page.locator('.os-card').first().innerText()), `${vp.n}: Truth Weaver public identity matches legal product`);
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.os-card h3')].map((e) => e.textContent))) === JSON.stringify(expectedOS), `${vp.n}: standalone OS identities preserved`);
  say((await page.locator('.os-card').first().locator('a.os-link').getAttribute('href')) === 'https://truthweaver.jussco.company', `${vp.n}: Truth Weaver card links to verified custom domain`);
  say((await page.evaluate(() => [...document.querySelectorAll('.os-kind')].every((e) => e.textContent === 'Standalone OS'))), `${vp.n}: every public system is labeled standalone OS`);
  say((await page.evaluate((names) => [...document.querySelectorAll('.os-card')].every((c) => { const text=c.innerText.toLowerCase(); return names.every((n) => text.includes(n.toLowerCase())); }), EXPECTED_CONNECTORS)), `${vp.n}: every standalone OS exposes Exa Notion Linear Slack fabric`);
  say((await page.evaluate(() => document.querySelector('.os-card:nth-child(3)')?.innerText.toLowerCase().includes('blocked'))), `${vp.n}: Exact Match connector fabric remains visibly blocked`);
  say((await page.evaluate(() => ![...document.querySelectorAll('.os-connectors span')].some((e) => e.dataset.state === 'connected'))), `${vp.n}: no connector claims connected without runtime proof`);
  say((await page.evaluate(() => [...document.querySelectorAll('.os-card')].every((c) => c.querySelector('.os-embed') && /already embedded in/i.test(c.querySelector('.os-embed').innerText)))), `${vp.n}: embedded relationships render without demoting identity`);
  say(!(await page.evaluate(() => document.getElementById('surfaceStrip').hidden)) && /Sync Playtest Signups/.test(await page.innerText('#surfaceStrip')) && /Sync Party/.test(await page.innerText('#surfaceStrip')), `${vp.n}: Sync supporting surface rolls up under Sync Party`);
  say(!/ULTRATHINK/.test(await page.innerText('#systems')), `${vp.n}: internal ULTRATHINK carriers stay off public surface`);
  say((await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)) === 0, `${vp.n}: no broken images`);
  say((await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)).length)) === 0, `${vp.n}: no dead anchors`);
  say((await page.evaluate(() => [...document.querySelectorAll('a,button')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 40; }).length)) === 0, `${vp.n}: tap targets >= 40px`);
  await page.click('.card:nth-child(4)'); await page.waitForTimeout(200);
  say((await page.innerText('#dName')) === 'Juss Beautiful Hair', `${vp.n}: drawer opens JBH`);
  say(/jussbeautifulhair\.com/.test((await page.getAttribute('#dCta a', 'href')) || ''), `${vp.n}: JBH link present`);
  say(!(await page.evaluate(() => document.getElementById('dContacts').hidden)), `${vp.n}: founder contacts render from data/worlds.json`);
  say((await page.locator('#dContactList a[href="mailto:support@jussbeautifulhair.com"]').count()) === 1, `${vp.n}: hair world displays clickable hair-store support email`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  say(await page.evaluate(() => document.getElementById('drawer').hidden), `${vp.n}: Escape closes drawer`);
  await page.click('.chip[data-group="Ideas & systems"]'); await page.waitForTimeout(150);
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(IDEA_WORLDS), `${vp.n}: filter chips follow world registry`);
  await page.locator('#proof').scrollIntoViewIfNeeded(); await page.click('.step:nth-child(5)'); await page.waitForTimeout(150);
  say(/^05 · PROVE$/i.test(await page.innerText('#sdName')), `${vp.n}: proof step detail`);
  say((await page.evaluate(() => window.JC && window.JC.quoteCount())) >= 5, `${vp.n}: quotes loaded from data`);
  const q0 = await page.innerText('#qText'); await page.click('#qNext'); await page.waitForTimeout(600); say((await page.innerText('#qText')) !== q0, `${vp.n}: quote rotates`);
  say(/@/.test(await page.innerText('#mail')) && !/\[/.test(await page.innerText('#mail')), `${vp.n}: real company email rendered`);
  say(errors.length === 0, `${vp.n}: no console errors${errors.length ? ' — ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `proof/site/${vp.n}.png`, fullPage: true });

  const servicePage = await ctx.newPage();
  const serviceErrors = [];
  servicePage.on('pageerror', (e) => serviceErrors.push(String(e)));
  servicePage.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) serviceErrors.push(`${r.failure()?.errorText} ${r.url()}`); });
  servicePage.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) serviceErrors.push(m.text()); });
  await servicePage.goto(`${url}services.html`, { waitUntil: 'load' });
  say((await servicePage.title()) === 'Work with Juss | Product & AI Systems Builder', `${vp.n}: services search title`);
  say((await servicePage.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/services.html', `${vp.n}: services canonical URL`);
  const serviceText = await servicePage.locator('body').innerText();
  say(/Work with Juss Rayy/i.test(serviceText) && !/Sajay|Juss Digital/i.test(serviceText), `${vp.n}: current Juss identity only`);
  say(['$49','$149','$399'].every((x) => serviceText.includes(x)), `${vp.n}: three fixed-price service offers`);
  say((await servicePage.locator('a[href^="mailto:founder@jussco.company"]').count()) === 4, `${vp.n}: company email inquiry paths`);
  say((await servicePage.locator('a[href*="linkedin.com/in/juss-rayy"]').count()) === 1, `${vp.n}: founder LinkedIn inquiry path`);
  say((await servicePage.locator('a[href*="PORTFOLIO_CASE_STUDIES.md"]').count()) === 1, `${vp.n}: case-study proof path`);
  say((await servicePage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: services no horizontal overflow`);
  say(/not proof that payment was collected/i.test(serviceText), `${vp.n}: payment truth boundary visible`);
  say(/Do not send passwords, API keys, payment credentials/i.test(serviceText), `${vp.n}: secret-sharing warning visible`);
  say(serviceErrors.length === 0, `${vp.n}: services no console errors${serviceErrors.length ? ' — ' + serviceErrors.join(' | ') : ''}`);
  await servicePage.screenshot({ path: `proof/site/services-${vp.n}.png`, fullPage: true });
  await ctx.close();
}

/* ---------- Games hub: code-level Playwright proof at exact source ---------- */
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' })); const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const response = await page.goto(url + 'games/index.html', { waitUntil: 'load' });
  say(response?.status() === 200, `games hub: ${vp.name} responds 200`);
  const headings = await page.locator('article.card h3').allTextContents();
  say(['SYNC', 'LUMORA', 'ChatQuest', 'Bip & Seek'].every(n => headings.includes(n)), `games hub: ${vp.name} all four worlds shown`);
  const editions = await page.locator('.edition h4').allTextContents();
  say(editions.length === 3 && ['Live Site SYNC', 'Chat SYNC', 'Lovable SYNC'].every(n => editions.some(x => x.includes(n))), `games hub: ${vp.name} distinct SYNC editions`);
  const links = await page.locator('.edition a.action').evaluateAll(nodes => nodes.map(x => x.getAttribute('href')));
  say(links.length === 3 && links.includes('https://sync.jussco.company/') && links.includes('https://sync.jussco.company/chat/') && links.includes('https://sync-playtest.lovable.app/'), `games hub: ${vp.name} canonical destinations`);
  say((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `games hub: ${vp.name} no horizontal overflow`);
  say(await page.locator('.card:has(h3:text("LUMORA")) a').count() === 0 && await page.locator('.card:has(h3:text("ChatQuest")) a').count() === 0, `games hub: ${vp.name} unreleased child games have no entry links`);
  say(errors.length === 0, `games hub: ${vp.name} no JS errors`);
  await page.screenshot({ path: `proof/site/games-${vp.name}.png`, fullPage: true });
  await ctx.close();
}


for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.name === 'mobile', hasTouch: vp.name === 'mobile' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${url}work.html`, { waitUntil: 'load' });
  say((await page.title()) === 'Selected Work | Juss Rayy · Juss & Co', `work page: ${vp.name} title`);
  say((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/work.html', `work page: ${vp.name} canonical`);
  say((await page.locator('article.card').count()) === 3, `work page: ${vp.name} three selected case studies`);
  say((await page.locator('a[href="https://sekretbip.net/"]').count()) === 1, `work page: ${vp.name} Se’kret Bip public route`);
  say((await page.locator('a[href="https://foundercontrolroom.org/"]').count()) === 1, `work page: ${vp.name} FCR public route`);
  say((await page.locator('a[href="https://sync.jussco.company/"]').count()) === 1, `work page: ${vp.name} SYNC public route`);
  say((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `work page: ${vp.name} no horizontal overflow`);
  say(errors.length === 0, `work page: ${vp.name} no JS errors`);
  await page.screenshot({ path: `proof/site/work-${vp.name}.png`, fullPage: true });
  await ctx.close();
}


await browser.close(); srv.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed'); process.exit(failed ? 1 : 0);
