const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: revenue page preserves truth boundaries`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    await expect(page).toHaveTitle('Juss Picks + Call Offers');
    await expect(page.getByRole('heading', { name: 'Useful picks. Real offers. Verified before promoted.' })).toBeVisible();
    await expect(page.getByText(/Disclosure:/)).toBeVisible();
    await expect(page.getByText('Amazon · activation blocked')).toBeVisible();
    await expect(page.getByText('eBay · activation blocked')).toBeVisible();
    await expect(page.getByText('DOPPCALL · account approved')).toBeVisible();
    await expect(page.getByText(/lawfully eligible account holder/)).toBeVisible();
    await expect(page.getByText(/lawful member\/account-holder authority/)).toBeVisible();

    const support = page.getByRole('link', { name: 'Support Juss' });
    await expect(support).toHaveAttribute('href', 'https://buymeacoffee.com/jussrayy');

    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(await page.locator('a.button.disabled').count()).toBe(0);
    expect(await page.locator('a').count()).toBe(1);
    expect(await page.locator('[aria-disabled="true"]').count()).toBe(3);

    const externalEarningLinks = await page.locator('a[href*="amazon."], a[href*="ebay."], a[href*="doppcall."]').count();
    expect(externalEarningLinks).toBe(0);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await context.close();
  });
}
