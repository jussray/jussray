/**
 * Independent Juss & Co. production witness using Cloudflare Browser Rendering.
 * Does not modify Cloudflare settings, deploy a Worker, or bypass Bot Fight Mode.
 * Requires a separate Browser Rendering Write token. Never logs its value.
 * Invocation: node scripts/verify-provider-site.mjs
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'jussray/jussray';
const HOSTS = ['jussco.company', 'www.jussco.company'];
const REGISTRIES = ['worlds', 'systems', 'connectors'];
const CANONICAL = 'https://www.jussco.company/';
const COMPANY_QR_LABEL = 'Scan to explore';
const HEALTH_PROBE_SCRIPT = `(async()=>{let code='network-error';try{const r=await fetch('/_telemetry/v1/health',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({probe:'health-v1'})});code=String(r.status)}catch{}document.documentElement.setAttribute('data-receiver-health',code)})();`;
const BIP_URL = 'https://sekretbip.jussco.company/';
const ENTER_BIP = `(()=>{let attempts=0;const timer=setInterval(()=>{const button=document.querySelector('[data-testid="web-welcome-enter"]');if(button&&!button.disabled){button.click();clearInterval(timer)}if(++attempts>45)clearInterval(timer)},100)})();`;
const OPEN_BIP_CARD = `(() => {let tries=0;const h=setInterval(() => {const card=Array.from(document.querySelectorAll('.card')).find(e => e.querySelector('h3')?.textContent?.trim() === "Se'kret Bip");if (card && card.querySelector('.go')) {card.querySelector('.go').click();clearInterval(h);}if (++tries > 30) clearInterval(h);},100);})();`;

export function gitBlobSha(buffer) {
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, 'utf8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export function extractScrapedRegistry(data) {
  if (!Array.isArray(data)) throw new Error('Cloudflare scrape result must be an array');
  const match = data.find(x => x?.selector === 'pre');
  if (!match || !Array.isArray(match.results) || match.results.length !== 1 || typeof match.results[0].text !== 'string') {
    throw new Error('Expected exactly one rendered pre element with text; refusing incomplete proof');
  }
  return match.results[0].text;
}

export function verifyWorldRegistry(raw) {
  const parsed = JSON.parse(raw);
  const bip = parsed.worlds?.find(x => x.name === "Se'kret Bip");
  if (!bip || bip.st !== 'soon' || bip.label !== 'Opening soon' ||
      bip.held !== 'Opening soon · no public link yet' ||
      bip.contact?.site !== 'https://sekretbip.net' || bip.link?.url) {
    throw new Error('Se\'kret Bip must remain a clearly gated upcoming product');
  }
}

export function verifySiteMarkdown(content) {
  if (typeof content !== 'string' || !content.includes('Turn thoughts into living works.') || !content.includes("### Se'kret Bip")) {
    throw new Error('Rendered Juss & Co. site markers missing');
  }
  if (!content.includes('Opening soon · no public link yet')) {
    throw new Error('Se\'kret Bip must not claim a public live preview');
  }
  if (!content.includes(COMPANY_QR_LABEL) || !content.includes('www.jussco.company')) {
    throw new Error('Canonical company QR destination missing from live homepage');
  }
  if (/Just a moment|Performing security verification|Origin DNS error/i.test(content)) {
    throw new Error('Browser saw Cloudflare challenge / DNS error, not the public site');
  }
}

export function verifyDestinationMarkdown(content, kind) {
  if (typeof content !== 'string') throw new Error('Browser returned no document');
  if (/Just a moment|Performing security verification|Origin DNS error|Error 1016/i.test(content)) {
    throw new Error('Destination is a challenge or DNS error, not a live public experience');
  }
  if (kind === 'bip' && !/title:\s*["']Se'kret Bip["']/.test(content)) throw new Error('Se\'kret Bip destination title mismatch');
  if (kind === 'games' && !/title:\s*["']Juss\s*&\s*Co\.? Games/i.test(content)) throw new Error('Games hub destination title mismatch');
}

export function verifyBipContent(html, stage) {
  if (typeof html !== 'string' || !html.startsWith('<!DOCTYPE html>')) {
    throw new Error('Se’kret Bip returned no rendered HTML');
  }
  if (/Sign in ・ Cloudflare Access|Just a moment|Origin DNS error|Error 1016/i.test(html)) {
    throw new Error('Se’kret Bip returned an access challenge or DNS error');
  }
  if (stage === 'welcome') {
    if (!html.includes('data-testid="web-welcome-shell"') ||
        !html.includes('data-testid="web-welcome-enter"') ||
        !html.includes('data-testid="web-welcome-sign-in"')) {
      throw new Error('Se’kret Bip welcome entry controls are not rendered');
    }
  } else if (stage === 'age') {
    if (!html.includes('How old are you?') || !html.includes('Choose an age bucket') || !html.includes("I'm a parent")) {
      throw new Error('Se’kret Bip age-assurance selection did not render after Enter');
    }
  } else {
    throw new Error('Unknown Se’kret Bip verification stage');
  }
}

export function verifyReceiverHealthHtml(content) {
  if (typeof content !== 'string' || !/<html[\s>]/i.test(content)) {
    throw new Error('Provider health proof did not return rendered HTML');
  }
  const found = content.match(/data-receiver-health=["']([^"']+)["']/);
  if (!found || found[1] !== '204') {
    throw new Error('Live first-party receiver health probe failed (expected HTTP 204 from schema readback)');
  }
  return true;
}

export function assertReleaseContext(env) {
  if (env.GITHUB_REF !== 'refs/heads/main' ||
      !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)) {
    throw new Error('Independent production witness runs only after main push or manual main dispatch');
  }
  return true;
}

export function assertSha(value) {
  if (!/^[a-f0-9]{40}$/.test(value || '')) throw new Error('Expected an exact 40-character commit SHA');
  return value;
}

const HTML_HASH_SCRIPT = `setTimeout(async()=>{
  try {
    const response=await fetch('/index.html',{cache:'no-store'});
    const source=await response.text();
    const bytes=new TextEncoder().encode(source);
    const prefix=new TextEncoder().encode('blob '+bytes.length+'\\0');
    const payload=new Uint8Array(prefix.length+bytes.length);
    payload.set(prefix);payload.set(bytes,prefix.length);
    const hash=await crypto.subtle.digest('SHA-1',payload);
    const sha=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
    document.documentElement.setAttribute('data-source-check',JSON.stringify({
      http:response.status,bytes:bytes.length,gitBlobSha1:sha,url:response.url,
    }));
  } catch(error) {
    document.documentElement.setAttribute('data-source-check',JSON.stringify({error:String(error).slice(0,160)}));
  }
},400);`;

// The apex is a declared same-path redirect to the canonical www host (CLAUDE.md).
// Accept exactly that hop; any other host is a failure.
export function acceptedHosts(host) {
  return host === 'jussco.company' ? ['jussco.company', 'www.jussco.company'] : [host];
}

export function verifyHtmlSourceMatch(html,expectedHash,host) {
  const match=typeof html==='string'&&html.match(/data-source-check="([^"]+)"/);
  if(!match)throw new Error('Browser did not record full HTML source readback');
  const result=JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&'));
  let observedHost='';
  try { observedHost=new URL(result.url).hostname; } catch {}
  if(result.error || result.http!==200 || !Number.isInteger(result.bytes)||result.bytes<100 ||
    result.gitBlobSha1!==expectedHash || !acceptedHosts(host).includes(observedHost)) {
    throw new Error('Public HTML source does not match checked-out Git blob');
  }
  return result.gitBlobSha1;
}

export function createQuickActionPacer({intervalMs=11000, now=()=>Date.now(),sleep=ms=>new Promise(done=>setTimeout(done,ms))}={}) {
  let next=0;
  return async()=>{const delay=Math.max(0,next-now());if(delay>0)await sleep(delay);next=now()+intervalMs;};
}

export function assertFinalDestination(requested, actual) {
  if (typeof requested !== 'string' || typeof actual !== 'string') {
    throw new Error('Provider did not attest target final URL');
  }
  let observed, wanted;
  try { observed = new URL(actual); wanted = new URL(requested === BIP_URL ? 'https://sekretbip.net/' : requested); }
  catch { throw new Error('Invalid provider final URL'); }
  const allowed = acceptedHosts(wanted.hostname).map(h => { const u = new URL(wanted.href); u.hostname = h; return u.href; });
  if (!allowed.includes(observed.href)) throw new Error('Public route redirected to unexpected destination');
}

export function makePartialReadbackWitness(expectedHead) {
  return {
    status:'PARTIAL_PUBLIC_READBACK',
    deploymentShaAttested:false,
    repo:REPO,
    sourceSha:assertSha(expectedHead),
    method:'Cloudflare REST Browser Rendering, public domains',
    registries:[],
    pageProof:[],
  };
}

export async function cfRequest({accountId, token, endpoint, body, fetchImpl=fetch, pace=async()=>{}, sleep=ms=>new Promise(done=>setTimeout(done,ms))}) {
  for (let attempt=1; attempt<=3; attempt++) {
    await pace();
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),45_000);
    try {
      const response=await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/${endpoint}?cacheTTL=0`,{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify(body),signal:controller.signal,
      });
      if(response.status===429 && attempt<3) {
        const retry=Number(response.headers?.get?.('retry-after'));
        await sleep(Number.isFinite(retry)&&retry>0?Math.min(60_000,Math.max(11_000,retry*1000)):11_000);
        continue;
      }
      // Never echo request headers, cookies, response bodies, or token text.
      if(!response.ok)throw new Error(`Browser Rendering ${endpoint}: HTTP ${response.status}`);
      const payload=await response.json();
      if(payload?.success!==true)throw new Error(`Browser Rendering ${endpoint}: provider unsuccessful`);
      // API HTTP 200 is not proof the TARGET page returned HTTP 200.
      if(payload.meta?.status!==200)throw new Error(`Public target ${endpoint}: HTTP ${payload.meta?.status??'unknown'}`);
      assertFinalDestination(body.url,payload.meta?.finalUrl);
      return payload.result;
    } finally {clearTimeout(timer);}
  }
  throw new Error('Provider Quick Action retries exhausted');
}

async function fetchHead(token, fetchImpl=fetch) {
  const response = await fetchImpl(`https://api.github.com/repos/${REPO}/git/ref/heads/main`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'jussco-provider-proof', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
  });
  if (!response.ok) throw new Error(`GitHub main ref lookup failed: HTTP ${response.status}`);
  return assertSha((await response.json()).object?.sha);
}

export async function runProof({env=process.env, fetchImpl=fetch, root=ROOT}={}) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_BROWSER_RENDERING_TOKEN;
  if (!/^[a-f0-9]{32}$/.test(accountId || '') || !token) {
    throw new Error('Missing scoped Cloudflare Browser Rendering token or account ID; production proof BLOCKED');
  }
  const expectedHead = assertSha(env.GITHUB_SHA);
  assertReleaseContext(env);
  const checkoutHead = execFileSync('git', ['rev-parse','HEAD'], {cwd:root, encoding:'utf8'}).trim();
  if (checkoutHead !== expectedHead) throw new Error('Git checkout SHA differs from GitHub Actions exact head');
  if (await fetchHead(env.GITHUB_TOKEN, fetchImpl) !== expectedHead) throw new Error('main moved before proof; evidence is stale');

  // A source SHA and public file matches do not attest the deployed Worker version.
  const witness = makePartialReadbackWitness(expectedHead);
  const pace = createQuickActionPacer();
  const request = (endpoint, body) => cfRequest({accountId, token, endpoint, body, fetchImpl, pace});
  for (const host of HOSTS) {
    for (const registry of REGISTRIES) {
      const source = readFileSync(resolve(root,`site/data/${registry}.json`));
      const sourceHash = gitBlobSha(source);
      const live = extractScrapedRegistry(await request('scrape', {
        url:`https://${host}/data/${registry}.json`, actionTimeout:18_000, elements:[{selector:'pre'}],
      }));
      const liveHash = gitBlobSha(live);
      if (sourceHash !== liveHash) throw new Error(`${host}/${registry}: live Git blob differs from exact checkout`);
      if (registry === 'worlds') verifyWorldRegistry(live);
      witness.registries.push({host,file:`data/${registry}.json`,gitBlobSha:liveHash,match:true});
      console.log(`VERIFIED ${host}/data/${registry}.json Git blob ${liveHash.slice(0,12)}`);
    }
    const rawHtml = await request('content',{url:`https://${host}/`,actionTimeout:20_000,
      waitForTimeout:2_500,addScriptTag:[{content:HTML_HASH_SCRIPT}]});
    const htmlGitBlobSha = verifyHtmlSourceMatch(rawHtml,gitBlobSha(readFileSync(resolve(root,'site/index.html'))),host);
    witness.pageProof.push({host,asset:'site/index.html',gitBlobSha:htmlGitBlobSha,match:true});
    console.log(`VERIFIED ${host}/index.html Git blob ${htmlGitBlobSha.slice(0,12)}`);
    for (const viewport of [{width:1440,height:900},{width:390,height:844,isMobile:true,hasTouch:true}]) {
      const markdown = await request('markdown', {
        url:`https://${host}/`, viewport, actionTimeout:18_000,
        waitForTimeout:1_100, addScriptTag:[{content:OPEN_BIP_CARD}],
      });
      verifySiteMarkdown(markdown);
      witness.pageProof.push({host,viewport:viewport.width,canonical:CANONICAL,companyQr:true,rendered:true});
      console.log(`VERIFIED ${host} ${viewport.width}px, company page and canonical scan link`);
    }
  }
  // Read-only, no synthetic conversion: the receiver checks D1 table presence but never INSERTs.
  const healthPage = await request('content', {
    url: CANONICAL, actionTimeout:18_000,
    addScriptTag:[{content:HEALTH_PROBE_SCRIPT}],
    waitForSelector:{selector:'html[data-receiver-health]',timeout:15_000},
  });
  verifyReceiverHealthHtml(healthPage);
  witness.pageProof.push({host:'www.jussco.company',firstPartyReceiverReadOnlyHealth:true,healthStatus:204});
  console.log('VERIFIED first-party receiver D1 health: HTTP 204 (no conversion rows written)');
  // The independent Se'kret Bip runtime and age-assurance proof belongs to
  // Se'kret Bip's release gate. Do not couple parent-site attestations to
  // unrelated or unfinished product flows.
  const gamesUrl = 'https://games.jussco.company/';
  const gamesMarkdown = await request('markdown',{url:gamesUrl,actionTimeout:18_000});
  verifyDestinationMarkdown(gamesMarkdown,'games');
  if (!gamesMarkdown.includes('# Choose your next adventure.') ||
      !gamesMarkdown.includes('[Play Live SYNC ↗](https://sync.jussco.company/)')) {
    throw new Error('Games hub public gameplay discovery markers missing');
  }
  witness.pageProof.push({host:'games.jussco.company',publicDestination:true,rendered:true});
  console.log('VERIFIED public Games hub and live SYNC discovery link');
  if (await fetchHead(env.GITHUB_TOKEN, fetchImpl) !== expectedHead) throw new Error('main moved during proof; evidence superseded');
  const folder = resolve(root,'proof/site');
  mkdirSync(folder,{recursive:true});
  const path = resolve(folder,`provider-${expectedHead}.json`);
  writeFileSync(path,JSON.stringify(witness,null,2)+'\n');
  console.log(`PUBLIC READBACK MATCHED at source ${expectedHead.slice(0,12)}; deployed SHA UNATTESTED; ${witness.registries.length} registry hashes + ${witness.pageProof.length} page checks`);
  return witness;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runProof().catch(error=>{console.error(`PROVIDER PROOF FAILED: ${error.message}`);process.exitCode=1;});
}
