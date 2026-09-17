const { test, expect } = require('@playwright/test');

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: founder profile is usable and truthful`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    const response = await page.goto('http://127.0.0.1:4173/profile/', { waitUntil: 'networkidle' });
    expect(response && response.ok()).toBeTruthy();

    await expect(page).toHaveTitle('Juss Rayy | Founder, Product & Systems Architect');
    await expect(page.getByRole('heading', { level: 1, name: 'I build human-centered products and founder-controlled systems.' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Building now' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Project ecosystem' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Public proof' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'How I build' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Find the lane that matches why you came.' })).toBeVisible();
    await expect(page.getByText('Proof before claim. More intelligence never means more authority.')).toBeVisible();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://jussray.github.io/jussray/profile/'
    );

    const expectedLinks = [
      'https://github.com/jussray',
      'https://www.linkedin.com/in/juss-rayy-13ba691a1',
      'https://sekretbip.net',
      'https://foundercontrolroom.org',
      'https://buymeacoffee.com/jussrayy',
      'https://github.com/jussray/Sekret-Bip',
      'https://github.com/jussray/founder-control-room',
      'https://github.com/jussray/chief-ai-machine',
      'https://github.com/jussray/promptos',
      'https://github.com/jussray/StoryEngine',
      'https://github.com/jussray/jussbeautifulhair-site',
      'https://github.com/jussray/THINK-TANK',
      'https://github.com/jussray/solcontinuity',
      'https://github.com/jussray/jussray',
    ];

    for (const href of expectedLinks) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    const projectNames = [
      'Se’kret Bip',
      'Founder Control Room',
      'Chief AI Machine',
      'PromptOS + Goalfix',
      'StoryEngine / L99',
      'Juss Beautiful Hair + Untold Stories',
      'THINK-TANK',
      'Sol Continuity',
    ];

    for (const name of projectNames) {
      await expect(page.getByRole('heading', { level: 3, name }).first()).toBeVisible();
    }

    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(await page.locator('a[href=""]').count()).toBe(0);

    const bodyText = await page.locator('body').innerText();
    const forbiddenClaims = [
      'ultrathink.solutions',
      'promptos.in',
      'Yuvadi29/PromptOS',
      'storyengine.app',
      'l99market.com',
      'founder@domain.com',
      'HUB_SPOT_API_KEY',
    ];

    for (const claim of forbiddenClaims) {
      expect(bodyText).not.toContain(claim);
    }

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    expect(consoleErrors).toEqual([]);

    await context.close();
  });
}
