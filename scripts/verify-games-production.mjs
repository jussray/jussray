// Production-only Chromium probe. A Cloudflare challenge remains a failed proof.
// Keep bot protection enabled; do not bypass security checks or treat 403 as success.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('proof/site', { recursive: true });
const browser = await chromium.launch();
let failed = 0;
const say = (ok, message) => { console.log(`${ok ? 'ok ' : 'FAIL'} ${message}`); if (!ok) failed++; };

/* Games production: exact domain is checked in a real Chromium session on CI. */
{
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

await browser.close();
console.log(failed ? `\n${failed} production check(s) FAILED` : '\nGames production browser proof passed');
process.exit(failed ? 1 : 0);
