// Exact-source Playwright proof for the Juss & Co site. Production reachability belongs to verify-provider-site.mjs.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
const ROOT = new URL('../site/', import.meta.url).pathname; const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf' };
const WORLD_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/worlds.json'), 'utf8')); const EXPECTED_WORLDS = WORLD_REGISTRY.worlds.map((w) => w.name); const IDEA_WORLDS = WORLD_REGISTRY.worlds.filter((w) => w.display?.group === 'Ideas & systems').map((w) => w.name);
const portfolio = JSON.parse(readFileSync(join(ROOT, 'data/portfolio.json'), 'utf8'));
const systems = JSON.parse(readFileSync(join(ROOT, 'data/systems.json'), 'utf8'));
const worlds = WORLD_REGISTRY;
const CONNECTOR_REGISTRY = JSON.parse(readFileSync(join(ROOT, 'data/connectors.json'), 'utf8')); const EXPECTED_CONNECTORS = CONNECTOR_REGISTRY.lanes.map((x) => x.name);
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = join(ROOT, p); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f)); });
await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const url = `http://127.0.0.1:${srv.address().port}/`; const universeUrl = url + 'universe.html';
mkdirSync('proof/site', { recursive: true });
const browser = await chromium.launch(); let failed = 0; const say = (ok, m) => { console.log(`${ok ? 'ok ' : 'FAIL'} ${m}`); if (!ok) failed++; };

const projectSlugs = portfolio.projects.map((project) => project.slug);
const featuredSlugs = portfolio.projects.filter((project) => project.featured).map((project) => project.slug).sort();
const worldOverlays = portfolio.featuredWorldOverlays || [];
const overlaySlugs = worldOverlays.map((overlay) => overlay.slug);
const declaredFeatured = [...portfolio.featuredWorlds].sort();
const projectBySlug = new Map(portfolio.projects.map((project) => [project.slug, project]));
const overlayBySlug = new Map(worldOverlays.map((overlay) => [overlay.slug, overlay]));
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
  ['Solwealth', 'solwealth'],
]);
const forbiddenProjectionTokens = ['jussray/jbh-private', 'jussray/exact-match-engine-', 'jussray/juss-protect-me', '6a9213ad92e06cfad8756b2b', '6a93e49bb1804a2648534bdf'];
const projectionText = JSON.stringify(portfolio);
const publicStandaloneSystems = systems.systems.filter((system) => system.public && system.kind === 'standalone_os').map((system) => system.name);
const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
say(/User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots) && robots.includes('https://www.jussco.company/sitemap.xml'), 'seo: robots allows crawl and declares canonical sitemap');
say(['https://www.jussco.company/','https://www.jussco.company/services.html','https://www.jussco.company/work.html','https://www.jussco.company/creative-history.html','https://www.jussco.company/games/'].every((x) => sitemap.includes(`<loc>${x}</loc>`)), 'seo: sitemap lists canonical public pages');
const expectedOS = ['Truth Weaver', 'Truth Compass', 'Exact Match Engine', 'Living Truth', 'Proof Core'];

// Short homepage and new page routes remain independent from the deep universe.
for (const vp of [{n:'desktop',w:1440,h:900},{n:'mobile',w:390,h:844}]) {
  const ctx=await browser.newContext({viewport:{width:vp.w,height:vp.h}});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const response=await page.goto(url,{waitUntil:'load'});
  say(response?.status()===200, `${vp.n}: homepage status 200`);
  say((await page.locator('main > section').count())===2,`${vp.n}: home has only introduction and navigation choices`);
  say((await page.locator('.site-header a[href="/products.html"]').count())===1,`${vp.n}: products has a proper page route`);
  say((await page.locator('.site-header a[href="/portfolio.html"]').count())===1,`${vp.n}: portfolio has a proper page route`);
  say((await page.locator('a[href="https://games.jussco.company/"]').count())>=2,`${vp.n}: game hub remains independent`);
  { const cta=page.locator('.site-header .work-cta'); const shown=await cta.isVisible(); say(!shown||(await cta.boundingBox()).height<=48,`${vp.n}: Work with Juss stays a compact header button (founder mockup), never oversized`); }
  say(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${vp.n}: homepage has no horizontal overflow`);
  say(await page.evaluate(()=>document.documentElement.scrollHeight<innerHeight*3.8),`${vp.n}: homepage scroll is bounded`);
  say(await page.evaluate(()=>getComputedStyle(document.querySelector('.cinematic'),'::before').backgroundImage.includes('home-scene.webp')),`${vp.n}: cinematic background retained`);
  // Founder mockup world stage (2026-11-08): crown, headline, ecosystem band from worlds.json, ambience controls.
  await page.waitForFunction(()=>document.querySelectorAll('#ecoTrack .eco-tile').length>0,null,{timeout:5000});
  const worldsData=JSON.parse(readFileSync(join(ROOT,'data/worlds.json'),'utf8')).worlds;
  say((await page.locator('#ecoTrack .eco-tile').count())===worldsData.length,`${vp.n}: Our Ecosystem band renders every world from worlds.json`);
  say(JSON.stringify(await page.locator('#ecoTrack .eco-tile small').allTextContents())===JSON.stringify(worldsData.map(w=>w.label)),`${vp.n}: band statuses equal founder-declared labels`);
  say((await page.locator('#ecoTrack .eco-tile a').evaluateAll(a=>a.map(x=>x.getAttribute('href')))).every(h=>worldsData.some(w=>w.link?.url===h&&(w.st!=='soon'||w.name==="Se'kret Bip"))),`${vp.n}: band links only real destinations with live front doors`);
  say((await page.locator('#ecoTrack a[href*="storyengine" i]').count())===0 && (await page.locator('#ecoTrack a[href="https://sekretbip.net"]').count())===1,`${vp.n}: StoryEngine stays unlinked; Se'kret Bip links to its founder-confirmed live front door`);
  say(/Creative Technology/.test(await page.locator('#landing-title').innerText())&&/AI-powered product creation/i.test(await page.locator('.subline').innerText()),`${vp.n}: mockup headline and subline render`);
  const bandBox=await page.locator('.eco-band').boundingBox();
  say(bandBox&&bandBox.y+bandBox.height<=vp.h+1,`${vp.n}: Our Ecosystem band is fully visible on the first screen`);
  const perView=await page.evaluate(()=>{const t=document.querySelector('#ecoTrack');const r=t.getBoundingClientRect();return [...t.querySelectorAll('.eco-tile')].filter(e=>{const b=e.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1}).length});
  say(vp.n==='mobile'?perView===3:perView>=6,`${vp.n}: ${vp.n==='mobile'?'three':'six or more'} ecosystem tiles per view (${perView})`);
  await page.click('#sound');
  say((await page.getAttribute('#sound','aria-checked'))==='true',`${vp.n}: ambient sound toggles on a user gesture`);
  say((await page.textContent('#atmoName'))==='Sunset'&&/\w{3} \d+ – \w{3} \d+/.test(await page.textContent('#seasonWindow')),`${vp.n}: opens on Sunset with the live season window (founder v3)`);
  await page.click('#home-search-toggle');await page.fill('#home-search-input','PromptOS');
  await page.waitForFunction(()=>document.querySelectorAll('#home-search-results a').length>0,null,{timeout:5000});
  say((await page.locator('#ecoTrack .eco-tile:not([hidden])').count())===1&&/1 in Our Ecosystem/.test(await page.textContent('#home-search-status')),`${vp.n}: header search filters Our Ecosystem`);
  say((await page.locator('#home-search-results a',{hasText:'PromptOS'}).getAttribute('href'))==='https://github.com/jussray/promptos',`${vp.n}: search result uses the worlds.json link`);
  const hrefFor=async(q,name)=>{await page.fill('#home-search-input',q);await page.waitForFunction(n=>[...document.querySelectorAll('#home-search-results a strong')].some(s=>s.textContent===n),name,{timeout:5000});return page.locator('#home-search-results a',{has:page.locator('strong',{hasText:new RegExp('^'+name+'$')})}).first().getAttribute('href');};
  say((await hrefFor('truth compass','Truth Compass'))==='/portfolio.html',`${vp.n}: portfolio-only projects open the portfolio, never a guessed link`);
  say((await hrefFor('lumora','LUMORA'))==='https://games.jussco.company/#lumora-world',`${vp.n}: search reaches Game Hub worlds`);
  say((await hrefFor('storyengine','StoryEngine'))==='/portfolio.html',`${vp.n}: StoryEngine stays unlinked in search`);
  say((await hrefFor('contact','Contact'))==='/contact.html',`${vp.n}: search reaches site pages`);
  await page.fill('#home-search-input','zzqx-nothing');await page.waitForFunction(()=>/Nothing matches/.test(document.querySelector('#home-search-status').textContent),null,{timeout:5000});
  say((await page.locator('#home-search-results li').count())===0,`${vp.n}: no false search results`);
  await page.keyboard.press('Escape');
  say((await page.locator('#ecoTrack .eco-tile[hidden]').count())===0,`${vp.n}: Escape clears the ecosystem search`);
  await page.locator('.hdr-btn.soon').first().click();
  say(/coming soon/i.test(await page.textContent('#home-toast')),`${vp.n}: unbuilt header features say coming soon`);
  say(!!(await page.locator('html').getAttribute('data-tod')),`${vp.n}: automatic atmosphere is set`);
  const atmoBefore=await page.textContent('#atmoName');await page.click('#atmo');
  say((await page.textContent('#atmoName'))!==atmoBefore,`${vp.n}: atmosphere card is visible and cycles (founder, 2026-11-13: keep the card)`);
  say((await page.locator('.site-header a[href="/ideas.html"]').count())===1,`${vp.n}: Ideas is in the main navigation`);
  if(vp.n==='mobile') {
    const button=page.locator('.menu-toggle');const menu=page.locator('#site-navigation');
    say(!(await menu.isVisible()),'mobile: main navigation starts collapsed');
    await button.click();
    say(await menu.isVisible()&&await button.getAttribute('aria-expanded')==='true','mobile: nav opens');
    await page.keyboard.press('Escape');
    say(!(await menu.isVisible())&&await button.getAttribute('aria-expanded')==='false','mobile: nav closes on Escape');
  }
  for(const route of ['products.html','sites.html','founder.html','contact.html','portfolio.html','services.html','work.html','games/index.html','opportunity-engine.html','universe.html']){
    const res=await page.request.get(url+route);say(res.status()===200,`${vp.n}: ${route} returns 200`);
  }
  await page.goto(url+'products.html',{waitUntil:'load'});
  say((await page.locator('.feature-card').count())===6,`${vp.n}: all six featured products on product page`);
   say((await page.locator('.feature-card a[href="/opportunity-engine.html"]').count())===1,`${vp.n}: Opportunity Engine is a discoverable product route`);
  await page.goto(url+'sites.html',{waitUntil:'load'});
  say((await page.locator('.directory-card').count())===11,`${vp.n}: eleven public destination cards on sites page`);
  say(errors.length===0,`${vp.n}: no JS exceptions on new routed pages${errors.length?' — '+errors.join(' | '):''}`);
  await ctx.close();
}
// Public site showcase: the long-form universe retains its original domain proof.

{
  const home = readFileSync(join(ROOT, 'universe.html'), 'utf8');
  const required = [
    'https://chief.foundercontrolroom.org',
    'https://sync.jussco.company/',
    'https://compass.jussco.company/',
    'https://exactmatch.jussco.company/',
    'https://jussbeautifulhair.com/',
    'https://protect.jussco.company/',
    'https://protect2.jussco.company/',
    'https://makevideo.jussco.company/',
    'https://junglejinx.jussco.company/',
    'https://lumora.jussco.company/'
  ];
  say(home.includes('id="live-sites"') && home.indexOf('id="live-sites"') < home.indexOf('id="worlds"'), 'site showcase: public destinations appear before project worlds');
  say(required.every((destination) => home.includes('href="' + destination + '"')), 'site showcase: ten external product destinations have direct links');
  say((home.match(/class="live-site-card"/g) || []).length === 11, 'site showcase: eleven public destination cards');
  say(home.includes('individual site availability and functionality may vary'), 'site showcase: deployment evidence is not mislabeled as runtime proof');
  say(home.includes('id="products"') && home.includes('checkout readiness are verified') && (home.match(/class="jc-feature jc-feature--/g) || []).length === 3, 'product marketing: distinct public pathways without unverified purchase claims');
}


say(portfolio.schemaVersion === 1, 'portfolio: schema v1');
say(portfolio.source?.mergeSha === 'b037ecce18863eb0be35098508b3b1fcf95c049d', 'portfolio: bound to merged FCR identity map');
say(portfolio.source?.technicalInventory === 'site/data/systems.json', 'portfolio: technical independence reconciles through systems inventory');
say(/non-authorizing/i.test(portfolio.authority || ''), 'portfolio: remains non-authorizing');
say(portfolio.projects.length === 20, 'portfolio: 20 public-safe canonical project identities');
say(new Set(projectSlugs).size === projectSlugs.length, 'portfolio: canonical slugs unique');
say(JSON.stringify([...featuredSlugs, ...overlaySlugs].sort()) === JSON.stringify(declaredFeatured), 'portfolio: featured-world declaration matches canonical flags plus noncanonical overlays');
say(worldOverlays.every((overlay) =>
  overlay.canonicalIdentity === false &&
  overlay.source === 'site/data/worlds.json' &&
  !projectBySlug.has(overlay.slug) &&
  worlds.worlds.some((world) => worldSlugByName.get(world.name) === overlay.slug &&
    world.name === overlay.name && world.repo === overlay.repository && world.label === overlay.publicLabel)
), 'portfolio: experimental world overlays preserve canonical company boundary and match world registry');
say(portfolio.featuredWorlds.length === worlds.worlds.length, 'portfolio: featured count matches worlds.json');
say(worlds.worlds.every((world) => {
  const slug = worldSlugByName.get(world.name);
  return slug && portfolio.featuredWorlds.includes(slug) &&
    (projectBySlug.get(slug) || overlayBySlug.get(slug))?.publicLabel === world.label;
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
  await page.goto(universeUrl, { waitUntil: 'load' });
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
// RFC 9116: verify the real static disclosure path in Chromium, not only file existence.
{
  const page = await browser.newPage();
  const response = await page.goto(new URL('.well-known/security.txt', url).href, { waitUntil: 'domcontentloaded' });
  const body = response ? await response.text() : '';
  const mime = response?.headers()['content-type'] || '';
  say(response?.status() === 200, 'security.txt: HTTP 200');
  say(mime.toLowerCase().startsWith('text/plain'), 'security.txt: text/plain response');
  say(/^Contact: mailto:security@jussco\.company$/m.test(body), 'security.txt: founder-approved reporting contact (mailto:security@jussco.company)');
  const expiration = body.match(/^Expires: ([^\r\n]+)$/m);
  say(Boolean(expiration && Date.parse(expiration[1]) > Date.now()), 'security.txt: future expiration');
  say((body.match(/^Canonical: https:\/\/(www\.)?jussco\.company\/\.well-known\/security\.txt$/gm) || []).length === 2, 'security.txt: canonical apex + www');
  await page.close();
}

for (const mode of ['abort', 'malformed']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
  // Deterministic first-party receiver fixture: PR checks must not call production.
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  await page.route('**/data/connectors.json', (r) => mode === 'abort'
    ? r.abort()
    : r.fulfill({ status: 200, contentType: 'application/json', body: '{not json' }));
  await page.goto(universeUrl, { waitUntil: 'load' });
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
  await page.goto(universeUrl, { waitUntil: 'load' });
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
  await page.goto(universeUrl, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelectorAll('.os-card').length === 5); await page.waitForTimeout(300);
  say((await page.locator('link[rel="canonical"]').count()) === 1 && (await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/universe.html', `${vp.n}: legacy universe canonical`);
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
  const resources=page.locator('#resources');
  say(await resources.count() === 1 && await resources.isVisible(), `${vp.n}: public resources visible`);
  for (const name of ['juss-co-company-overview.pdf','juss-co-selected-work-evidence.pdf']) {
    const link=resources.locator('a[href="/downloads/'+name+'"]');
    say(await link.count() === 1 && await link.getAttribute('target') === '_blank' &&
      (await link.getAttribute('rel'))?.includes('noopener') && (await link.getAttribute('rel'))?.includes('noreferrer'),
      `${vp.n}: ${name} safe new-tab link`);
    const pdf=await page.request.get(url+'downloads/'+name);
    say(pdf.status() === 200 && (await pdf.body()).subarray(0,8).toString() === '%PDF-1.4',
      `${vp.n}: ${name} actual PDF`);
  }
  const companyEmail=await page.locator('#mail').textContent();
  say(companyEmail==='founder@jussco.company' && (await page.locator('#mail').getAttribute('href'))==='mailto:'+companyEmail, `${vp.n}: company email text and mailto match business address`);
  const directory=page.locator('#projectContactDirectory');
  await directory.waitFor({state:'visible',timeout:5000});
  say(await directory.isVisible(), `${vp.n}: per-project contact directory available`);
  await directory.locator('summary').click();
  const routes=await page.locator('#projectContactList li').evaluateAll(nodes=>nodes.map(li=>({name:li.querySelector('strong')?.textContent,href:li.querySelector('a')?.getAttribute('href'),text:li.querySelector('a')?.textContent,shared:li.querySelector('small')?.textContent||''})));
  const byName=Object.fromEntries(routes.map(r=>[r.name,r]));
  say(routes.length===EXPECTED_WORLDS.length, `${vp.n}: every world has a discoverable project contact`);
  say(byName['Founder Control Room']?.href==='mailto:support@foundercontrolroom.org' && byName['Juss Beautiful Hair']?.href==='mailto:hello@jussbeautifulhair.com' && byName["Se'kret Bip"]?.href==='mailto:founder@sekretbip.net' && byName['Bip Jr']?.href==='mailto:support@sekretbip.net', `${vp.n}: domain-specific FCR, hair and Bip routing preserved`);
  say(routes.every(r=>r.href==='mailto:'+r.text && !r.href.includes('[')) && !routes.some(r=>r.name!=='Juss Beautiful Hair' && r.href.endsWith('@jussbeautifulhair.com')), `${vp.n}: project emails have matching mailto and no hair-store leakage`);
  say(byName['StoryEngine']?.href==='mailto:support@jussco.company' && byName['StoryEngine']?.shared.includes('Shared'), `${vp.n}: projects without proven mailboxes show shared company support`);

  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say(await page.evaluate(() => document.querySelector('.top .brand').getBoundingClientRect().height <= 44), `${vp.n}: header wordmark stays on one line`);
  say(await page.evaluate(() => document.querySelector('.top .btn').getBoundingClientRect().right <= window.innerWidth - 16), `${vp.n}: header CTA stays inside the side gutter`);
  say(await page.locator('.hero .h-brand').isVisible() && (await page.locator('.hero .h-line').innerText()).includes('Turn thoughts into'), `${vp.n}: cinematic living-world artwork and real-text headline render`);
  say(await page.evaluate(() => new Promise((resolve) => {
    const img = new Image(); img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false); img.src = '/assets/ideas-night.webp';
  })), `${vp.n}: hero artwork asset resolves`);
  say((await page.locator('#products .jc-feature').count()) === 3, `${vp.n}: three product pathways render`);
  say((await page.locator('.jc-feature--shop a').getAttribute('href')) === 'https://jussbeautifulhair.com/' &&
      (await page.locator('.jc-feature--play a').getAttribute('href')) === 'https://sync.jussco.company/' &&
      (await page.locator('.jc-feature--coming a').getAttribute('href')) === '/portfolio.html',
      `${vp.n}: shop, public experience, and coming-soon destinations remain distinct`);
  if (vp.n === 'mobile') say(await page.evaluate(() => {
    const scene = document.querySelector('.jc-scene')?.getBoundingClientRect();
    const eyebrow = document.querySelector('.hero .eyebrow')?.getBoundingClientRect();
    const title = document.querySelector('.hero .h-brand')?.getBoundingClientRect();
    return !!eyebrow && !!title && title.left >= 12 && title.right <= window.innerWidth - 12;
  }), 'mobile: artwork clears headline and wordmark stays in viewport');
  if (vp.n === 'mobile') say(await page.evaluate(() => { const top = (el) => el.getBoundingClientRect().top + window.scrollY; return top(document.querySelector('.hero .eyebrow')) >= top(document.querySelector('#ecosystem')) + document.querySelector('#ecosystem').getBoundingClientRect().height; }), 'mobile: hero eyebrow sits below the ecosystem band (page coordinates)');
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
  say(!/ULTRATHINK/.test(await page.innerText('#systems')), `${vp.n}: internal ULTRATHINK carriers stay off public systems surface`);
  say((await page.locator('a[href="portfolio.html"]').count()) === 1, `${vp.n}: complete portfolio is discoverable from primary nav`);
  say((await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length)) === 0, `${vp.n}: no broken images`);
  say((await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)).length)) === 0, `${vp.n}: no dead anchors`);
  const undersizedTargets = await page.evaluate(() => [...document.querySelectorAll('a,button')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 40; }).map((e) => ({ tag: e.tagName.toLowerCase(), className: String(e.className).slice(0, 100), text: (e.textContent || '').trim().slice(0, 48), height: Math.round(e.getBoundingClientRect().height * 10) / 10 })).slice(0, 16));
  say(undersizedTargets.length === 0, `${vp.n}: tap targets >= 40px${undersizedTargets.length ? ' — ' + JSON.stringify(undersizedTargets) : ''}`);
  await page.click('.card:nth-child(4)'); await page.waitForTimeout(200);
  say((await page.innerText('#dName')) === 'Juss Beautiful Hair', `${vp.n}: drawer opens JBH`);
  say(/jussbeautifulhair\.com/.test((await page.getAttribute('#dCta a', 'href')) || ''), `${vp.n}: JBH link present`);
  say(!(await page.evaluate(() => document.getElementById('dContacts').hidden)), `${vp.n}: founder contacts render from data/worlds.json`);
  say((await page.locator('#dContactList a[href="mailto:hello@jussbeautifulhair.com"]').count()) >= 1, `${vp.n}: hair world displays clickable hair-store email (hello@)`);
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

for (const vp of [{ n: 'portfolio-desktop', w: 1440, h: 900 }, { n: 'portfolio-mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${url}portfolio.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#projects .project').length === 20);
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say((await page.locator('#projects .project').count()) === 20, `${vp.n}: renders all 20 public-safe identities`);
  say((await page.locator('#worldOverlays .project[data-noncanonical="true"]').count()) === worldOverlays.length &&
    (await page.locator('#worldOverlays h3').allTextContents()).every((name) => worldOverlays.some((overlay) => overlay.name === name)) &&
    (await page.locator('#worldOverlays .state').allTextContents()).every((label) => worldOverlays.some((overlay) => overlay.publicLabel === label)),
    `${vp.n}: homepage-only experimental world is visible without becoming a canonical project`);
  const names = await page.locator('#projects .project h3').allTextContents();
  say(['AYURE', 'Truth Weaver Counsel', 'Exact Match Engine', 'Living Truth', 'Proof Core'].every((name) => names.includes(name)), `${vp.n}: reconciled projects are present`);
  say(((await page.textContent('#countLine')) || '').startsWith('20 of 20'), `${vp.n}: portfolio count is data-derived`);
  const story = page.locator('#projects .project', { has: page.locator('h3', { hasText: 'StoryEngine' }) });
  say((await story.locator('a.open').count()) === 0, `${vp.n}: StoryEngine has no invented front-door link`);
  const sync = page.locator('#projects .project', { has: page.locator('h3', { hasText: 'SYNC Party' }) });
  say((await sync.locator('.state').textContent()) === 'Live', `${vp.n}: Sync Party remains Live`);
  await page.click('button[data-category="Founder software"]'); await page.waitForTimeout(100);
  say((await page.locator('#worldOverlays .project').count()) === 0, `${vp.n}: experimental worlds stay separate from canonical project category filters`);
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


/* ---------- Builds for others: honest status, no unconsented client names ---------- */
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  await page.route('**/_telemetry/v1', (route) => route.fulfill({ status: 204, body: '' }));
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  const response = await page.goto(url + 'builds.html', { waitUntil: 'load' });
  say(response?.status() === 200, `builds: ${vp.name} responds 200`);
  const pills = await page.locator('article.build .pill').allTextContents();
  say(pills.length === 2 && pills.includes('Built · not on a domain yet') && pills.includes('Building · not launched'), `builds: ${vp.name} two builds with honest status`);
  say(!/Pappa|Razzy|Bleeding/i.test(await page.locator('body').innerText()), `builds: ${vp.name} no unconsented client names`);
  say((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `builds: ${vp.name} no horizontal overflow`);
  say(errors.length === 0, `builds: ${vp.name} no JS errors`);
  await page.screenshot({ path: `proof/site/builds-${vp.name}.png`, fullPage: true });
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


/* ---------- Creation Core idea generator ---------- */
for (const vp of [{ n: 'ideas-desktop', w: 1440, h: 900 }, { n: 'ideas-tablet', w: 834, h: 1112, m: true }, { n: 'ideas-mobile', w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) errors.push(`${r.failure()?.errorText} ${r.url()}`); }); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${url}ideas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#products input').length > 0);
  say((await page.locator('link[rel="canonical"]').getAttribute('href')) === 'https://www.jussco.company/ideas.html', `${vp.n}: canonical URL`);
  say((await page.locator('#products input').count()) === portfolio.projects.length, `${vp.n}: product chips derive from portfolio.json`);
  say((await page.locator('#cards .card').count()) === 3, `${vp.n}: three starting candidates`);
  say(await page.evaluate(() => Promise.all(['/assets/ideas-day.webp','/assets/ideas-night.webp','/assets/ideas-sunset.webp','/assets/ideas-day-sm.webp','/assets/ideas-night-sm.webp','/assets/ideas-sunset-sm.webp'].map((src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalWidth > 0); i.onerror = () => ok(false); i.src = src; }))).then((r) => r.every(Boolean))), `${vp.n}: day and night scene art resolves`);
  const text = await page.textContent('body');
  say(!/\d+\s*%\s*YoY|\+\d+%/i.test(text), `${vp.n}: no fabricated demand statistics`);
  say((await page.locator('#cards .status').allTextContents()).every((t) => /unverified/i.test(t)), `${vp.n}: every candidate labelled unverified`);
  await page.fill('#goal', 'Find shopify store and product catalog opportunities');
  await page.click('#generate');
  await page.waitForFunction(() => /ranked by fit|Nothing matched/.test(document.querySelector('#candKicker').textContent));
  say((await page.locator('#cards .card').first().getAttribute('data-lane')) === 'shopping', `${vp.n}: commerce goal ranks shopping lane first`);
  say(/Fit is not demand/.test(await page.textContent('#candKicker')), `${vp.n}: fit/demand boundary visible`);
  await page.click('#sound');
  say((await page.getAttribute('#sound', 'aria-checked')) === 'true', `${vp.n}: ambient sound toggles on a user gesture`);
  const before = await page.textContent('#atmoName'); await page.click('#atmo');
  say((await page.textContent('#atmoName')) !== before, `${vp.n}: atmosphere cycles`);
  say((await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) === 0, `${vp.n}: no horizontal overflow`);
  say((await page.evaluate(() => [...document.querySelectorAll('a,button,summary')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height < 40; }).length)) === 0, `${vp.n}: tap targets >= 40px`);
  say((await page.locator('header.ws-top nav a[href="/products.html"]').count()) === 1 && (await page.locator('a[href^="/#"]').count()) === 0, `${vp.n}: shell nav uses the destination pages, no stale homepage anchors`);
  say(!/jussco-signature-world/.test(readFileSync(join(ROOT, 'assets/flagship.css'), 'utf8')) && !existsSync(join(ROOT, 'assets/jussco-signature-world.jpg')), `${vp.n}: founder-rejected living-room artwork stays retired`);
  say(errors.length === 0, `${vp.n}: no console errors${errors.length ? ' — ' + errors.join(' | ') : ''}`);
  await page.screenshot({ path: `proof/site/${vp.n}.png`, fullPage: true }); await ctx.close();
}

await browser.close(); srv.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nall checks passed'); process.exit(failed ? 1 : 0);
