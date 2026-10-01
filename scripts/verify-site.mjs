// Exact-head Playwright proof for the Juss & Co site. Run: node scripts/verify-site.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const portfolio = JSON.parse(readFileSync(join(ROOT, 'data/portfolio.json'), 'utf8'));
const worlds = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8'));
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
]);
const forbiddenProjectionTokens = ['jussray/jbh-private', 'jussray/exact-match-engine-', 'jussray/juss-protect-me', '6a93e49bb1804a2648534bdf', '6a94aed27e712e8fd5058c2f'];
const projectionText = JSON.stringify(portfolio);

say(portfolio.schemaVersion === 1, 'portfolio: schema v1');
say(portfolio.source?.mergeSha === 'b037ecce18863eb0be35098508b3b1fcf95c049d', 'portfolio: bound to merged FCR identity map');
say(/non-authorizing/i.test(portfolio.authority || ''), 'portfolio: remains non-authorizing');
say(portfolio.projects.length === 19, 'portfolio: 19 public-safe canonical project identities');
say(new Set(projectSlugs).size === projectSlugs.length, 'portfolio: canonical slugs unique');
say(JSON.stringify(featuredSlugs) === JSON.stringify(declaredFeatured), 'portfolio: featured-world declaration matches project flags');
say(portfolio.featuredWorlds.length === worlds.worlds.length, 'portfolio: featured count matches worlds.json');
say(worlds.worlds.every((world) => {
  const slug = worldSlugByName.get(world.name);
  return slug && portfolio.featuredWorlds.includes(slug) && projectBySlug.get(slug)?.publicLabel === world.label;
}), 'portfolio: featured public labels agree with worlds.json');
say(!projectBySlug.get('storyengine')?.link && !projectBySlug.get('sekret-bip')?.link, 'portfolio: unopened front doors have no public product links');
say(forbiddenProjectionTokens.every((token) => !projectionText.includes(token)), 'portfolio: unresolved/private/legacy carriers stay out of public projection');

for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'tablet', w: 834, h: 1112, m: true }, { n: 'mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(600);
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say((await page.$$('.card')).length === 6, `${vp.n}: six featured worlds`);
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
  say(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.card')].filter((c) => !c.hidden).map((c) => c.querySelector('h3').textContent))) === JSON.stringify(['Founder Control Room', 'Chief AI']), `${vp.n}: filter chips`);
  await page.locator('#proof').scrollIntoViewIfNeeded(); await page.click('.step:nth-child(5)'); await page.waitForTimeout(150);
  say(/^05 · PROVE$/i.test(await page.innerText('#sdName')), `${vp.n}: proof step detail`);
  say((await page.evaluate(() => window.JC && window.JC.quoteCount())) >= 5, `${vp.n}: quotes loaded from data`);
  const q0 = await page.innerText('#qText'); await page.click('#qNext'); await page.waitForTimeout(600); say((await page.innerText('#qText')) !== q0, `${vp.n}: quote rotates`);
  say(/@/.test(await page.innerText('#mail')) && !/\[/.test(await page.innerText('#mail')), `${vp.n}: real company email rendered`);
  say(errors.length === 0, `${vp.n}: no console errors${errors.length ? ' — ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `proof/site/${vp.n}.png`, fullPage: true }); await ctx.close();
}
await browser.close(); srv.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed'); process.exit(failed ? 1 : 0);
