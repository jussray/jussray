// Exact-head Playwright proof for the Juss & Co site. Run: node scripts/verify-site.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);
const portfolio = JSON.parse(readFileSync(join(ROOT, 'data/portfolio.json'), 'utf8'));
const systems = JSON.parse(readFileSync(join(ROOT, 'data/systems.json'), 'utf8'));
const worlds = WORLD_REGISTRY;
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

for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'tablet', w: 834, h: 1112, m: true }, { n: 'mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction((n) => document.querySelectorAll('.card').length === n, EXPECTED_WORLDS.length); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say((await page.$$('.card')).length === EXPECTED_WORLDS.length, `${vp.n}: ${EXPECTED_WORLDS.length} portfolio worlds`);
  const worldNames = await page.evaluate(() => [...document.querySelectorAll('.card h3')].map((e) => e.textContent));
  say(['Bip Jr','PromptOS','SolContinuity','Untold Stories','SWEATS','SleepWealth Agent','Think Tank','Alexa Commerce Engine','Ayure'].every((n) => worldNames.includes(n)), `${vp.n}: remaining portfolio worlds render`);
  say((await page.innerText('#filters .chip[data-group=""] .n')) === String(EXPECTED_WORLDS.length).padStart(2,'0'), `${vp.n}: world count follows registry`);
  say((await page.$$('.os-card')).length === 5, `${vp.n}: five public standalone OS builds`);
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.os-card h3')].map((e) => e.textContent))) === JSON.stringify(expectedOS), `${vp.n}: standalone OS identities preserved`);
  say((await page.evaluate(() => [...document.querySelectorAll('.os-kind')].every((e) => e.textContent === 'Standalone OS'))), `${vp.n}: every public system is labeled standalone OS`);
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
await browser.close(); srv.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed'); process.exit(failed ? 1 : 0);
