const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: Sajay Digital service path is usable and truthful`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle(/Sajay Digital/);
    await expect(page.getByRole('heading', { name: 'Stop guessing what’s broken.' })).toBeVisible();
    await expect(page.getByText('$49', { exact: true })).toBeVisible();
    await expect(page.getByText('$149', { exact: true })).toBeVisible();
    await expect(page.getByText('$399', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start a $49 audit' })).toHaveAttribute('href', '#start');
    await expect(page.getByRole('link', { name: 'Start a $149 fix' })).toHaveAttribute('href', '#start');
    await expect(page.getByRole('link', { name: 'Start a $399 build' })).toHaveAttribute('href', '#start');
    await expect(page.getByRole('link', { name: 'Message me on LinkedIn ↗' })).toHaveAttribute('href', 'https://www.linkedin.com/in/juss-rayy-13ba691a1');
    await expect(page.getByText(/not proof that a service payment has been collected/i)).toBeVisible();
    await expect(page.getByText(/Do not send passwords, API keys, payment credentials/i)).toBeVisible();

    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await context.close();
  });

  test(`${viewport.name}: affiliate experiment remains isolated and fail-closed`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/picks/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Juss Picks + Call Offers');
    await expect(page.getByText('Amazon · activation blocked')).toBeVisible();
    await expect(page.getByText('eBay · activation blocked')).toBeVisible();
    await expect(page.getByText('DOPPCALL · account approved')).toBeVisible();
    expect(await page.locator('a[href*="amazon."], a[href*="ebay."], a[href*="doppcall."]').count()).toBe(0);
    const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await context.close();
  });
}
