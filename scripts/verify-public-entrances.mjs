/** Read-only public entrance probe. Never sends cookies, credentials, or request bodies. */
import { pathToFileURL } from 'node:url';

const ALLOWED_HOSTS = new Set(['jussco.company', 'www.jussco.company']);
export const PUBLIC_ENTRANCES = Object.freeze([
  'https://jussco.company/',
  'https://www.jussco.company/'
]);
const CHALLENGE = /Just a moment|Sign in\s*[・·–-]?\s*Cloudflare Access|cf-chl|Performing security verification|Origin DNS error|Error 1016|Attention Required!\s*\|\s*Cloudflare/i;
const COMPANY_TITLE = /<title\b[^>]*>[^<]*Juss\s*(?:&amp;|&#38;|&)\s*Co\b[^<]*<\/title>/i;

export function validatePublicUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Not an approved public homepage'); }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname) || url.port ||
      url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('Not an approved public homepage');
  }
  return url.toString();
}

export async function inspectPublicEntrance(input, {request = fetch, timeoutMs = 10000} = {}) {
  let target = validatePublicUrl(input);
  const visited = new Set();
  for (let redirect = 0; redirect < 3; redirect++) {
    if (visited.has(target)) return {state: 'BLOCKED', reason: 'redirect-loop', origin: input};
    visited.add(target);
    let response;
    try {
      response = await request(target, {
        method: 'GET',
        redirect: 'manual',
        headers: {'accept': 'text/html'},
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      return {state: 'UNKNOWN', reason: 'network-or-timeout', origin: input};
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location');
      try { target = validatePublicUrl(new URL(next, target).toString()); }
      catch { return {state: 'BLOCKED', reason: 'redirect-outside-public-home', origin: input}; }
      continue;
    }
    if ([401, 403, 429, 503].includes(response.status)) {
      return {state: 'BLOCKED', reason: 'http-' + response.status, origin: input};
    }
    if (response.status !== 200) return {state: 'FAIL', reason: 'http-' + response.status, origin: input};
    if (!/^text\/html\b/i.test(response.headers.get('content-type') || '')) {
      return {state: 'FAIL', reason: 'not-html', origin: input};
    }
    let body;
    try { body = await response.text(); }
    catch { return {state: 'UNKNOWN', reason: 'response-unreadable', origin: input}; }
    if (CHALLENGE.test(body)) return {state: 'BLOCKED', reason: 'challenge-or-access', origin: input};
    if (!COMPANY_TITLE.test(body)) return {state: 'FAIL', reason: 'company-title-missing', origin: input};
    return {state: 'PASS', reason: 'public-company-homepage', origin: input};
  }
  return {state: 'BLOCKED', reason: 'too-many-redirects', origin: input};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3 || process.argv[2] !== '--live') {
    console.error('Usage: node scripts/verify-public-entrances.mjs --live (public GET only; no account access)');
    process.exitCode = 2;
  } else {
    const results = await Promise.all(PUBLIC_ENTRANCES.map((url) => inspectPublicEntrance(url)));
    for (const result of results) console.log(JSON.stringify(result));
    if (results.some((result) => result.state !== 'PASS')) process.exitCode = 1;
  }
}
