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
const BIP_URL = 'https://sekretbip.jussco.company/';
const BUTTON_TEXT = "Visit Se'kret Bip preview";
const ENTER_BIP = `setTimeout(() => { document.querySelector('[data-testid="web-welcome-enter"]')?.click(); }, 300);`;
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
  if (!bip || bip.link?.url !== BIP_URL || bip.label !== 'Public preview' || bip.contact?.site !== 'https://sekretbip.net') {
    throw new Error('Se\'kret Bip world must be a public preview with standalone product URL');
  }
}

export function verifySiteMarkdown(content) {
  if (typeof content !== 'string' || !content.includes('Turn thoughts into living works.') || !content.includes("### Se'kret Bip")) {
    throw new Error('Rendered Juss & Co. site markers missing');
  }
  if (!content.includes(`[${BUTTON_TEXT} ↗](${BIP_URL})`)) {
    throw new Error('Se\'kret Bip card button missing from opened live drawer');
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
    throw new Error('Se\\'kret Bip returned no rendered HTML');
  }
  if (/Sign in ・ Cloudflare Access|Just a moment|Origin DNS error|Error 1016/i.test(html)) {
    throw new Error('Se\\'kret Bip returned an access challenge or DNS error');
  }
  if (stage === 'welcome') {
    if (!html.includes('data-testid="web-welcome-shell"') ||
        !html.includes('data-testid="web-welcome-enter"') ||
        !html.includes('data-testid="web-welcome-sign-in"')) {
      throw new Error('Se\\'kret Bip welcome entry controls are not rendered');
    }
  } else if (stage === 'age') {
    if (!html.includes('How old are you?') || !html.includes('Choose an age bucket') || !html.includes("I'm a parent")) {
      throw new Error('Se\\'kret Bip age-assurance selection did not render after Enter');
    }
  } else {
    throw new Error('Unknown Se\\'kret Bip verification stage');
  }
}

export function assertSha(value) {
  if (!/^[a-f0-9]{40}$/.test(value || '')) throw new Error('Expected an exact 40-character commit SHA');
  return value;
}

async function cfRequest({accountId, token, endpoint, body, fetchImpl=fetch}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/${endpoint}?cacheTTL=0`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    // Never echo request headers, Cloudflare API response bodies, or token text.
    if (!response.ok) throw new Error(`Browser Rendering ${endpoint}: HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.success !== true) throw new Error(`Browser Rendering ${endpoint}: provider returned unsuccessful result`);
    return payload.result;
  } finally {
    clearTimeout(timer);
  }
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
  if (env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch') {
    throw new Error('This release witness runs only on a manually dispatched main branch');
  }
  const checkoutHead = execFileSync('git', ['rev-parse','HEAD'], {cwd:root, encoding:'utf8'}).trim();
  if (checkoutHead !== expectedHead) throw new Error('Git checkout SHA differs from GitHub Actions exact head');
  if (await fetchHead(env.GITHUB_TOKEN, fetchImpl) !== expectedHead) throw new Error('main moved before proof; evidence is stale');

  const witness = { status:'VERIFIED', repo:REPO, sha:expectedHead, method:'Cloudflare REST Browser Rendering, public domains', registries:[], pageProof:[] };
  const request = (endpoint, body) => cfRequest({accountId, token, endpoint, body, fetchImpl});
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
    for (const viewport of [{width:1440,height:900},{width:390,height:844,isMobile:true,hasTouch:true}]) {
      const markdown = await request('markdown', {
        url:`https://${host}/`, viewport, actionTimeout:18_000,
        waitForTimeout:1_100, addScriptTag:[{content:OPEN_BIP_CARD}],
      });
      verifySiteMarkdown(markdown);
      witness.pageProof.push({host,viewport:viewport.width,worldLink:BIP_URL,rendered:true});
      console.log(`VERIFIED ${host} ${viewport.width}px, Se'kret Bip public preview CTA`);
    }
  }
  // A page title alone cannot prove the teen-facing app is rendered or usable.
  // Verify real rendered HTML plus the harmless welcome -> age-gate transition.
  verifyBipContent(await request('content',{url:BIP_URL,actionTimeout:20_000,waitForTimeout:1_200}),'welcome');
  verifyBipContent(await request('content',{url:BIP_URL,actionTimeout:20_000,waitForTimeout:2_200,
    addScriptTag:[{content:ENTER_BIP}]}),'age');
  witness.pageProof.push({host:'sekretbip.jussco.company',publicDestination:true,rendered:true,stages:['welcome','age-selection']});
  console.log('VERIFIED Se\\'kret Bip welcome and age-selection UI; no signup submitted');

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
  console.log(`VERIFIED independent provider-side production evidence at ${expectedHead.slice(0,12)}; ${witness.registries.length} registry hashes + ${witness.pageProof.length} page checks`);
  return witness;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runProof().catch(error=>{console.error(`PROVIDER PROOF FAILED: ${error.message}`);process.exitCode=1;});
}
