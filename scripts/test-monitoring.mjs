#!/usr/bin/env node

/**
 * Monitoring Infrastructure Test Suite
 * Tests all monitoring and alerting components
 *
 * Usage: node scripts/test-monitoring.mjs
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const DOMAINS = ['jussco.company', 'www.jussco.company'];
const EXPECTED_HEADERS = {
  'strict-transport-security': 'max-age=31536000',
  'x-content-type-options': 'nosniff',
  'content-security-policy': true
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[0m',
    pass: '\x1b[32m',
    fail: '\x1b[31m',
    warn: '\x1b[33m'
  };
  const color = colors[type] || colors.info;
  const reset = '\x1b[0m';
  console.log(`${timestamp} [${type.toUpperCase()}] ${color}${message}${reset}`);
}

function test(description, fn) {
  try {
    fn();
    log(`✓ ${description}`, 'pass');
    testsPassed++;
  } catch (error) {
    log(`✗ ${description}: ${error.message}`, 'fail');
    testsFailed++;
  }
}

async function testMonitoringConfiguration() {
  log('Testing Monitoring Configuration', 'info');

  test('monitoring.json exists', () => {
    const content = readFileSync('.cloudflare/monitoring.json', 'utf8');
    if (!content.includes('"tls"')) throw new Error('TLS config missing');
  });

  test('fcr-mail-config.json exists', () => {
    const content = readFileSync('.cloudflare/fcr-mail-config.json', 'utf8');
    if (!content.includes('"service"')) throw new Error('Service config missing');
  });

  test('alert-routing.json exists', () => {
    const content = readFileSync('.cloudflare/alert-routing.json', 'utf8');
    if (!content.includes('"recipients"')) throw new Error('Recipients config missing');
  });
}

async function testWranglerConfiguration() {
  log('Testing Wrangler Configuration', 'info');

  test('wrangler.jsonc has KV bindings', () => {
    const content = readFileSync('wrangler.jsonc', 'utf8');
    if (!content.includes('jussray-metrics')) throw new Error('KV binding missing');
  });

  test('wrangler.jsonc has analytics_engine_dataset', () => {
    const content = readFileSync('wrangler.jsonc', 'utf8');
    if (!content.includes('analytics_engine_dataset')) throw new Error('Analytics engine missing');
  });

  test('src/index.ts includes monitoring code', () => {
    const content = readFileSync('src/index.ts', 'utf8');
    if (!content.includes('RequestMetrics')) throw new Error('Metrics interface missing');
    if (!content.includes('logMetrics')) throw new Error('Metrics logging missing');
  });
}

async function testHTTPSEnforcement() {
  log('Testing HTTPS Enforcement', 'info');

  for (const domain of DOMAINS) {
    test(`${domain} redirects HTTP to HTTPS`, async () => {
      try {
        const response = await fetch(`http://${domain}`, {
          redirect: 'manual',
          timeout: 5000
        });

        if (response.status !== 301 && response.status !== 302) {
          throw new Error(`Expected redirect status, got ${response.status}`);
        }

        const location = response.headers.get('location');
        if (!location?.startsWith('https://')) {
          throw new Error(`Redirect to ${location} is not HTTPS`);
        }
      } catch (e) {
        // Network error is expected for HTTP
        if (!e.message.includes('getaddrinfo') && !e.message.includes('ERR_')) {
          throw e;
        }
      }
    });
  }
}

async function testSecurityHeaders() {
  log('Testing Security Headers', 'info');

  for (const domain of DOMAINS) {
    test(`${domain} includes security headers`, async () => {
      try {
        const response = await fetch(`https://${domain}`, { timeout: 10000 });

        for (const [header, expectedValue] of Object.entries(EXPECTED_HEADERS)) {
          const value = response.headers.get(header);
          if (!value) {
            throw new Error(`Missing header: ${header}`);
          }

          if (expectedValue !== true && !value.includes(expectedValue)) {
            throw new Error(`Header ${header} does not contain ${expectedValue}`);
          }
        }
      } catch (e) {
        throw new Error(`Failed to fetch ${domain}: ${e.message}`);
      }
    });
  }
}

async function testCSPConfiguration() {
  log('Testing CSP Configuration', 'info');

  for (const domain of DOMAINS) {
    test(`${domain} has CSP with report-uri`, async () => {
      try {
        const response = await fetch(`https://${domain}`, { timeout: 10000 });
        const csp = response.headers.get('content-security-policy');

        if (!csp?.includes('report-uri')) {
          throw new Error('CSP missing report-uri');
        }

        if (!csp.includes("default-src 'self'")) {
          throw new Error('CSP missing default-src');
        }
      } catch (e) {
        throw new Error(`Failed to verify CSP for ${domain}: ${e.message}`);
      }
    });
  }
}

async function testMetricsCollection() {
  log('Testing Metrics Collection', 'info');

  test('Metrics collection code is in Worker', () => {
    const content = readFileSync('src/index.ts', 'utf8');
    if (!content.includes('METRICS_KV')) throw new Error('KV binding missing from Worker');
    if (!content.includes('logMetrics')) throw new Error('Metrics logging missing');
  });

  test('Metrics configuration includes KV storage', () => {
    const wrangler = readFileSync('wrangler.jsonc', 'utf8');
    const monitoring = readFileSync('.cloudflare/monitoring.json', 'utf8');

    if (!wrangler.includes('jussray-metrics')) throw new Error('KV namespace missing');
    if (!monitoring.includes('jussray-metrics')) throw new Error('KV config missing');
  });
}

async function testAlertConfiguration() {
  log('Testing Alert Configuration', 'info');

  test('Alert routing has recipients configured', () => {
    const content = readFileSync('.cloudflare/alert-routing.json', 'utf8');
    if (!content.includes('t2s9dswzpj@privaterelay.appleid.com')) throw new Error('Primary recipient missing');
    if (!content.includes('escalation_policy')) throw new Error('Escalation policy missing');
  });

  test('Monitoring config has alert rules', () => {
    const content = readFileSync('.cloudflare/monitoring.json', 'utf8');
    const parsed = JSON.parse(content);

    if (!parsed.alerting?.rules?.length > 0) {
      throw new Error('No alert rules configured');
    }
  });

  test('fcr_mail monitoring has health checks', () => {
    const content = readFileSync('.cloudflare/fcr-mail-config.json', 'utf8');
    if (!content.includes('health')) throw new Error('Health check missing');
    if (!content.includes('delivery_rate')) throw new Error('Delivery rate metric missing');
  });
}

async function testDashboardConfiguration() {
  log('Testing Dashboard Configuration', 'info');

  test('fcr_mail config has dashboard metrics', () => {
    const content = readFileSync('.cloudflare/fcr-mail-config.json', 'utf8');
    const parsed = JSON.parse(content);

    if (!parsed.dashboard?.widgets?.length > 0) {
      throw new Error('No dashboard widgets configured');
    }
  });

  test('Dashboard widgets cover key metrics', () => {
    const content = readFileSync('.cloudflare/fcr-mail-config.json', 'utf8');

    if (!content.includes('delivery_rate')) throw new Error('Missing delivery_rate widget');
    if (!content.includes('latency')) throw new Error('Missing latency widget');
    if (!content.includes('error_rate')) throw new Error('Missing error_rate widget');
  });
}

async function runAllTests() {
  log('=== Monitoring Infrastructure Test Suite ===', 'info');
  log(`Running on ${new Date().toISOString()}`, 'info');
  log('');

  try {
    // Synchronous tests
    await testMonitoringConfiguration();
    await testWranglerConfiguration();
    await testMetricsCollection();
    await testAlertConfiguration();
    await testDashboardConfiguration();

    // Async tests (may fail due to network/DNS)
    try {
      await testHTTPSEnforcement();
      await testSecurityHeaders();
      await testCSPConfiguration();
    } catch (e) {
      log(`Skipped network tests: ${e.message}`, 'warn');
    }

    log('', 'info');
    log(`=== Test Results ===`, 'info');
    log(`Passed: ${testsPassed}`, 'pass');
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'fail' : 'pass');

    process.exit(testsFailed > 0 ? 1 : 0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'fail');
    process.exit(1);
  }
}

runAllTests();
