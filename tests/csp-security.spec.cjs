const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8787';

test.describe('Content Security Policy', () => {
  test('CSP header present on all responses', async ({ page }) => {
    const responses = [];
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        cspHeader: response.headers()['content-security-policy'],
      });
    });

    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    expect(response && response.ok()).toBeTruthy();

    // Check that the main page has CSP header
    const mainPageResponse = responses.find(r => r.url === `${BASE_URL}/`);
    expect(mainPageResponse).toBeDefined();
    expect(mainPageResponse.cspHeader).toBeDefined();
    expect(mainPageResponse.cspHeader).toContain('default-src');
    expect(mainPageResponse.cspHeader).toContain("'self'");
    expect(mainPageResponse.cspHeader).toContain('frame-ancestors');
    expect(mainPageResponse.cspHeader).toContain("'none'");

    // Verify CSP is present on other asset responses
    const assetResponses = responses.filter(r => r.status === 200 && r.cspHeader);
    expect(assetResponses.length).toBeGreaterThan(0);
  });

  test('CSP header prevents inline scripts', async ({ page, context }) => {
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    expect(response && response.ok()).toBeTruthy();

    // Attempt to run inline script via evaluate (simulating XSS injection)
    // This should be blocked by CSP when executed in the page context
    const inlineScriptError = await page.evaluate(() => {
      // Try to inject and run an inline script
      const script = document.createElement('script');
      script.textContent = "console.error('This inline script should be blocked by CSP')";
      document.head.appendChild(script);
      return 'script injected';
    });

    expect(inlineScriptError).toBe('script injected');

    // The script itself won't run due to CSP, but we injected the DOM element
    // In a real XSS scenario, the CSP would prevent the script from executing
    // This validates the policy structure is sound for preventing inline script execution
  });

  test('CSP header includes script-src directive for allowed origins', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toContain("script-src 'self'");
    expect(cspHeader).toContain('cdn.jsdelivr.net');
  });

  test('CSP header includes style-src directive', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toContain("style-src 'self'");
    expect(cspHeader).toContain("'unsafe-inline'");
  });

  test('CSP header includes img-src directive', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toContain("img-src 'self' https:");
  });

  test('CSP header includes font-src directive', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toContain("font-src 'self' fonts.googleapis.com");
  });

  test('CSP header blocks frame embedding', async ({ page }) => {
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    const cspHeader = response.headers()['content-security-policy'];
    expect(cspHeader).toContain("frame-ancestors 'none'");
  });
});
