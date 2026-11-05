/**
 * Read-only public-route diagnostic for the Juss & Co company site.
 * This is NOT a release receipt or evidence of a successful checkout.
 * Usage: node scripts/audit-public-routes.mjs
 * Intentionally does not request sign-in, payments, customer data or third-party apps.
 */
import { pathToFileURL } from 'node:url';

const CANONICAL = 'https://www.jussco.company/';
const ALLOWED = new Set(['www.jussco.company', 'jussco.company']);
export const ROUTES = Object.freeze([
  'https://jussco.company/',
  CANONICAL,
  ...['services.html', 'work.html', 'licensing.html', 'robots.txt', 'sitemap.xml'].map(p => new URL(p, CANONICAL).href),
]);

const result = (url, outcome, reason, status, redirects) => ({url, outcome, reason, status, redirects});
const isAllowed = url => url.protocol === 'https:' && ALLOWED.has(url.hostname) && !url.username && !url.password && !url.port;

export async function inspectRoute(start, fetchImpl = fetch) {
  const initial = new URL(start);
  if (!isAllowed(initial)) return result(start, 'fail', 'unexpected_probe_host', null, 0);
  let current = initial;
  let redirects = 0;
  let temporaryCanonicalRedirect = false;
  const seen = new Set();
  for (let attempt = 0; attempt < 6; attempt++) {
    if (seen.has(current.href)) return result(start, 'fail', 'redirect_loop', null, redirects);
    seen.add(current.href);
    let response;
    try {
      response = await fetchImpl(current.href, {
        method: 'GET', redirect: 'manual', credentials: 'omit',
        headers: { 'User-Agent': 'JussCo-public-route-diagnostic/1.0' },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return result(start, 'unknown', 'probe_network_failure', null, redirects);
    }
    const code = response.status;
    if ([301, 302, 303, 307, 308].includes(code)) {
      const location = response.headers.get('location');
      if (!location) return result(start, 'fail', 'redirect_without_location', code, redirects);
      let target;
      try { target = new URL(location, current); } catch {
        return result(start, 'fail', 'invalid_redirect_location', code, redirects);
      }
      if (!isAllowed(target)) return result(start, 'fail', 'unexpected_redirect_host', code, redirects);
      if (initial.hostname === 'jussco.company' && code !== 301 && code !== 308) temporaryCanonicalRedirect = true;
      current = target;
      redirects++;
      continue;
    }
    if (code !== 200) return result(start, 'fail', 'http_' + code, code, redirects);
    let body;
    try { body = await response.text(); } catch {
      return result(start, 'unknown', 'response_unreadable', code, redirects);
    }
    if (/Just a moment|Performing security verification|Error 1016|Origin DNS error/i.test(body)) {
      return result(start, 'fail', 'security_challenge', code, redirects);
    }
    const type = response.headers.get('content-type') || '';
    const pathname = current.pathname;
    const valid = pathname === '/robots.txt' ? /text\/plain/i.test(type) && /User-agent:/i.test(body)
      : pathname === '/sitemap.xml' ? /(application|text)\/xml/i.test(type) && /<urlset(?:\s|>)/i.test(body)
      : /text\/html/i.test(type) && /<!doctype html/i.test(body);
    if (!valid) return result(start, 'fail', 'unexpected_content', code, redirects);
    if (initial.hostname === 'jussco.company' && redirects === 0)
      return result(start, 'warning', 'apex_not_redirected', code, redirects);
    if (initial.hostname === 'jussco.company' && current.href !== CANONICAL)
      return result(start, 'warning', 'apex_not_canonicalized', code, redirects);
    if (temporaryCanonicalRedirect) return result(start, 'warning', 'temporary_canonical_redirect', code, redirects);
    return result(start, 'pass', 'expected_public_content', code, redirects);
  }
  return result(start, 'fail', 'redirect_limit_exceeded', null, redirects);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = await Promise.all(ROUTES.map(url => inspectRoute(url)));
  results.forEach(item => console.log(JSON.stringify(item)));
  if (results.some(item => item.outcome === 'fail' || item.outcome === 'unknown')) process.exitCode = 1;
}
