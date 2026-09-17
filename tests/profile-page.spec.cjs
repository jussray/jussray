const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: founder profile is usable and truthful`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    const response = await page.goto('http://127.0.0.1:4173/profile/', { waitUntil: 'networkidle' });
    expect(response && response.ok()).toBeTruthy();

    await expect(page).toHaveTitle('Juss Rayy | Founder & Product Builder');
    await expect(page.getByRole('heading', { level: 1, name: 'I turn ideas into working systems.' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Selected work' })).toBeVisible();
    await expect(page.getByText('More intelligence never means more authority.')).toBeVisible();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://jussray.github.io/jussray/profile/'
    );

    const expectedLinks = [
      'https://github.com/jussray',
      'https://www.linkedin.com/in/juss-rayy-13ba691a1',
      'https://foundercontrolroom.org',
      'https://sekretbip.net',
      'https://buymeacoffee.com/jussrayy',
      'https://github.com/jussray/jussray',
      'https://github.com/jussray/StoryEngine',
    ];

    for (const href of expectedLinks) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(await page.locator('a[href=""]').count()).toBe(0);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await context.close();
  });
}
