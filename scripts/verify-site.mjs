// Exact-head Playwright proof for the Juss & Co site. Run: node scripts/verify-site.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript' };
const WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);
const portfolio = JSON.parse(readFileSync(join(ROOT, 'data/portfolio.json'), 'utf8'));
const systems = JSON.parse(readFileSync(join(ROOT, 'data/systems.json'), 'utf8'));
const worlds = WORLD_REGISTRY;
const CONNECTOR_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/connectors.json'), 'utf8')); const EXPECTED_CONNECTORS = CONNECTOR_REGISTRY.lanes.map((x) => x.name);
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = join(ROOT, p); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const url = `http://127.0.0.1:${srv.address().port}/`;
mkdirSync('proof/site', { recursive: true });
const browser = await chromium.launch(); let failed = 0; const say = (ok, m) => { console.log(`${ok ? 'ok ' : 'FAIL'} ${m}`); if (!ok) failed++; };

const projectSlugs = portfolio.projects.map((project) => project.slug);
const featuredSlugs = portfolio.projects.filter((project) => project.featured).map((project) => project.slug).sort();
const declaredFeatured = [...portfolio.featuredWorlds].sort();
const projectBySlug = new Map(portfolio.projects.map((project) => [project.slug, project]));
const worldSlugByName = new Map([
  ["Se'kret Bip", 'sekret-bip'],
  ['Founder Control Room', 'founder-control-room'],
  ['Chief AI', 'chief-ai-machine'],
  ['Juss Beautiful Hair', 'juss-beautiful-hair'],
  ['StoryEngine', 'storyengine'],
  ['Sync Party', 'sync-party'],
  ['Bip Jr', 'bip-jr'],
  ['PromptOS', 'promptos'],
  ['SolContinuity', 'solcontinuity'],
  ['Untold Stories', 'untold-stories'],
  ['SWEATS', 'sweats'],
  ['SleepWealth Agent', 'sleepwealth-agent'],
  ['Think Tank', 'think-tank'],
  ['Alexa Commerce Engine', 'alexa-commerce-engine'],
  ['Ayure', 'ayure'],
]);
const forbiddenProjectionTokens = ['jussray/jbh-private', 'jussray/exact-match-engine-', 'jussray/juss-protect-me', '6a9213ad92e06cfad8756b2b', '6a93e49bb1804a2648534bdf'];
const projectionText = JSON.stringify(portfolio);
const publicStandaloneSystems = systems.systems.filter((system) => system.public && system.kind === 'standalone_os').map((system) => system.name);
const expectedOS = ['Truth Weaver', 'Truth Compass', 'Exact Match Engine', 'Living Truth', 'Proof Core'];

say(portfolio.schemaVersion === 1, 'portfolio: schema v1');
say(portfolio.source?.mergeSha === 'b037ecce18863eb0be35098508b3b1fcf95c049d', 'portfolio: bound to merged FCR identity map');
say(portfolio.source?.technicalInventory === 'site/data/systems.json', 'portfolio: technical independence reconciles through systems inventory');
say(/non-authorizing/i.test(portfolio.authority || ''), 'portfolio: remains non-authorizing');
say(portfolio.projects.length === 20, 'portfolio: 20 public-safe canonical project identities');
say(new Set(projectSlugs).size === projectSlugs.length, 'portfolio: canonical slugs unique');
say(JSON.stringify(featuredSlugs) === JSON.stringify(declaredFeatured), 'portfolio: featured-world declaration matches project flags');
say(portfolio.featuredWorlds.length === worlds.worlds.length, 'portfolio: featured count matches worlds.json');
say(worlds.worlds.every((world) => {
  const slug = worldSlugByName.get(world.name);
  return slug && portfolio.featuredWorlds.includes(slug) && projectBySlug.get(slug)?.publicLabel === world.label;
}), 'portfolio: featured public labels agree with worlds.json');
say(!projectBySlug.get('storyengine')?.link && !projectBySlug.get('sekret-bip')?.link, 'portfolio: unopened front doors have no public product links');
say(forbiddenProjectionTokens.every((token) => !projectionText.includes(token)), 'portfolio: internal/private/legacy carriers stay out of public projection');
say(expectedOS.every((name) => publicStandaloneSystems.includes(name)), 'systems: public standalone technical identities remain represented');
say(projectBySlug.get('proof-core')?.technicalForm === 'standalone_os_prototype', 'portfolio: Proof Core stays a prototype rather than being promoted to a company');
say(['truth-compass', 'truth-weaver', 'exact-match-engine'].every((slug) => projectBySlug.get(slug)?.technicalForm === 'standalone_os'), 'portfolio: standalone system form is preserved without changing commercial role');

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
  say((await page.$$('.card')).length === EXPECTED_WORLDS.length, `${vp.n}: ${EXPECTED_WORLDS.length} portfolio worlds`);
  say((await page.locator('.os-card').count()) === 5, `${vp.n}: five public standalone OS builds`);
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.os-card h3')].map((e) => e.textContent))) === JSON.stringify(expectedOS), `${vp.n}: standalone OS identities preserved`);
  const worldNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));
  say(['Bip Jr','PromptOS','SolContinuity','Untold Stories','SWEATS','SleepWealth Agent','Think Tank','Alexa Commerce Engine','Ayure'].every((n) => worldNames.includes(n)), `${vp.n}: remaining portfolio worlds render`);
  say((await page.innerText('#filters .chip[data-group=""] .n')) === String(EXPECTED_WORLDS.length).padStart(2,'0'), `${vp.n}: world count follows registry`);
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
  say(!/ULTRATHINK/.test(await page.innerText('#systems')), `${vp.n}: internal ULTRATHINK carriers stay off public systems surface`);
  say((await page.locator('a[href="portfolio.html"]').count()) === 1, `${vp.n}: complete portfolio is discoverable from primary nav`);
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
  await page.screenshot({ path: `proof/site/${vp.n}.png`, fullPage: true }); await ctx.close();
}

for (const vp of [{ n: 'portfolio-desktop', w: 1440, h: 900 }, { n: 'portfolio-mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${url}portfolio.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#projects .project').length === 20);
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say((await page.locator('#projects .project').count()) === 20, `${vp.n}: renders all 20 public-safe identities`);
  const names = await page.locator('#projects .project h3').allTextContents();
  say(['AYURE', 'Truth Weaver Counsel', 'Exact Match Engine', 'Living Truth', 'Proof Core'].every((name) => names.includes(name)), `${vp.n}: reconciled projects are present`);
  say(((await page.textContent('#countLine')) || '').startsWith('20 of 20'), `${vp.n}: portfolio count is data-derived`);
  const story = page.locator('#projects .project', { has: page.locator('h3', { hasText: 'StoryEngine' }) });
  say((await story.locator('a.open').count()) === 0, `${vp.n}: StoryEngine has no invented front-door link`);
  const sync = page.locator('#projects .project', { has: page.locator('h3', { hasText: 'SYNC Party' }) });
  say((await sync.locator('.state').textContent()) === 'Live', `${vp.n}: Sync Party remains Live`);
  await page.click('button[data-category="Founder software"]'); await page.waitForTimeout(100);
  say((await page.locator('#projects .project').count()) === 10, `${vp.n}: category filter renders ten founder-software identities`);
  say(((await page.textContent('#countLine')) || '').startsWith('10 of 20'), `${vp.n}: filtered count updates`);
  say((await page.evaluate(() => [...document.querySelectorAll('a,button')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 40; }).length)) === 0, `${vp.n}: tap targets >= 40px`);
  say(errors.length === 0, `${vp.n}: no console errors${errors.length ? ' — ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `proof/site/${vp.n}.png`, fullPage: true }); await ctx.close();
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


/* Games production: exact domain is checked in a real Chromium session on CI push runs only.
   PR runs skip this external-production fetch (same scope as the live-domain steps in site-proof.yml);
   the local source/Games checks above still run on every PR. */
if (process.env.CI === 'true' && process.env.GITHUB_EVENT_NAME !== 'pull_request') {
  const live = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let response = null, lastError = '';
  for (let attempt = 1; attempt <= 3 && !response; attempt++) {
    try { response = await live.goto('https://games.jussco.company/', { waitUntil: 'domcontentloaded', timeout: 25000 }); }
    catch (error) { lastError = String(error); if (attempt < 3) await new Promise(r => setTimeout(r, 4000)); }
  }
  // Cloudflare may present a legitimate browser challenge to hosted CI. Give
  // the browser a bounded opportunity to finish it; never bypass, mock, or
  // reclassify a 403 as success. The canonical document must still return 200.
  if (response?.status() === 403 && response.headers()['cf-mitigated'] === 'challenge') {
    console.log('games production: Cloudflare challenge observed; waiting for normal browser completion');
    try {
      await live.waitForFunction(() => document.title.includes('Juss & Co. Games'), null, { timeout: 20000 });
      response = await live.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (error) {
      lastError = 'Browser challenge incomplete: ' + String(error).slice(0, 180);
    }
  }
  if (response && response.status() !== 200) {
    const h = response.headers();
    const title = await live.title().catch(() => 'unavailable');
    const snippet = (await live.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 240);
    console.error(`games production diagnostic: status=${response.status()} title=${JSON.stringify(title)} cf-mitigated=${h['cf-mitigated'] || 'none'} server=${h.server || 'none'} body=${JSON.stringify(snippet)}`);
  }
  say(response?.status() === 200, `games production: exact domain HTTP 200 (observed ${response?.status() ?? 'no response'}, final URL ${response?.url() ?? 'none'}, cf-ray ${response?.headers()['cf-ray'] ?? 'none'})${lastError && !response ? ' / '+lastError : ''}`);
  if (response?.status() === 200) {
    const title = await live.title();
    const body = await live.locator('main').innerText().catch(() => '');
    say(title.includes('Juss & Co. Games') && ['LUMORA','Live Site SYNC','Chat SYNC','Lovable SYNC','Jungle Jinx'].every(name => body.includes(name)), 'games production: all latest hub content visible');
    say((await live.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 0, 'games production: 390px viewport has no overflow');
    await live.screenshot({ path: 'proof/site/games-production-mobile.png', fullPage: true });
  }
  await live.close();
}

await browser.close(); srv.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed'); process.exit(failed ? 1 : 0);
