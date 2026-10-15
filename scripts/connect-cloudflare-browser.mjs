// Production browser proof runs through Cloudflare Browser Run via Playwright CDP.
// Keep source/local tests in the GitHub runner; only production browsing is remote.
// Do not omit or catch missing credentials as successful verification.
import { chromium } from 'playwright';

export function connectCloudflareBrowser() {
  const accountId = process.env.CF_ACCOUNT_ID?.trim();
  const token = process.env.CF_BROWSER_RUN_TOKEN?.trim();
  if (!accountId || !/^[a-f0-9]{32}$/.test(accountId) || !token) {
    throw new Error('Production Chromium proof requires CF_ACCOUNT_ID and CF_BROWSER_RUN_TOKEN (Browser Rendering - Edit scope)');
  }
  return chromium.connectOverCDP(
    `wss://api.cloudflare.com/client/v4/accounts/${accountId}/browser-run/devtools/browser?keep_alive=600000`,
    { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
  );
}
