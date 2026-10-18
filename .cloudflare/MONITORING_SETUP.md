# Production Monitoring & Alerting Infrastructure

**Status:** DEPLOYED  
**Date:** 2026-10-18  
**Authority:** Juss  

## Overview

Complete monitoring and alerting infrastructure for Juss & Co production environment (`jussco.company` and `www.jussco.company`).

## Architecture Components

### 1. TLS/Certificate Monitoring
- **Status:** Active
- **Domains:** jussco.company, www.jussco.company
- **Alert Trigger:** Certificate expiration within 30 days
- **Alert Severity:** Critical
- **Configuration:** `.cloudflare/monitoring.json` → `tls` section

### 2. HTTPS Enforcement
- **Status:** Active
- **Mechanism:** HTTP redirect to HTTPS at Worker layer
- **TLS Minimum Version:** 1.2
- **HSTS Header:** max-age=3600 (escalate to 31536000 after cert renewal testing)
- **Test:** Both domains redirect HTTP → HTTPS (verified)

### 3. Content Security Policy (CSP) Monitoring
- **Status:** Active
- **Report URI:** `/_csp-report`
- **Alert Threshold:** 10+ violations per hour
- **Configuration:** src/index.ts → CSP header with report-uri

### 4. Worker Performance Metrics
- **Latency SLO:** 500ms (alert at 1000ms+)
- **Error Rate Threshold:** 1%+
- **Cache Hit Rate Target:** 95%+
- **Storage:** KV namespace `jussray-metrics`
- **Retention:** 7 days

### 5. fcr_mail Service Monitoring
- **Endpoints:**
  - API: `https://fcr-mail.internal/api/v1` (timeout: 10s)
  - Health: `https://fcr-mail.internal/health` (interval: 60s)
  - Metrics: `https://fcr-mail.internal/metrics` (interval: 300s)

- **Key Metrics:**
  - Delivery Rate Target: 99.5% (alert at <98%)
  - Latency SLO: 5000ms (alert at >15000ms)
  - Queue Depth Alert: >10000 messages
  - API Response Time Alert: >5000ms

- **SLA Targets:**
  - Uptime: 99.9%
  - Delivery Success: 99.5%
  - Latency (p99): 5000ms

### 6. Alert Routing & Escalation

**Primary Recipients:**
- Juss (Founder): t2s9dswzpj@privaterelay.appleid.com
- Ops Backup: ops-backup@jussco.company
- Incident Channel: https://alerts.internal/incidents (webhook)

**Escalation Policy:**
- **Level 1 (5 min):** Email to primary recipient
- **Level 2 (15 min):** Email + webhook to primary + backup + create ticket
- **Level 3 (30 min):** Critical escalation + page if severity=critical

**Critical Alerts:**
1. TLS certificate expiring within 30 days
2. fcr_mail delivery rate < 98%
3. Worker error rate > 1%
4. Service availability issues

### 7. Production Health Dashboard

**Location:** `https://jussco.company/monitoring/dashboard.html`

**Widgets:**
- TLS Certificate Status & Days Until Expiry
- HTTPS Redirect Rate
- CSP Violation Count & Rate
- Worker Response Time (p99)
- Worker Error Rate
- Cache Hit Rate
- fcr_mail Delivery Rate
- fcr_mail Average Latency
- Active Alerts
- Service Status Summary Table

**Features:**
- Real-time updates (60-second refresh)
- Status indicators (green/yellow/red)
- Comprehensive service health overview
- Alert and event timeline

## Configuration Files

### monitoring.json
Master monitoring configuration with:
- TLS alerts
- HTTPS enforcement rules
- CSP monitoring
- Worker performance thresholds
- fcr_mail monitoring setup
- Alert rules and channels

### fcr-mail-config.json
Email service monitoring with:
- Endpoint health checks
- Delivery rate tracking
- Latency monitoring
- Queue depth tracking
- Dashboard widgets
- SLA tracking

### alert-routing.json
Incident response configuration with:
- Recipient definitions
- Escalation policies (3 levels)
- Routing rules by severity
- Alert suppression rules
- Alert grouping
- Incident ticket creation

## Implementation Details

### Worker Changes (src/index.ts)
- Added `RequestMetrics` interface for tracking
- Metrics logging to KV: `logMetrics()` function
- CSP report-uri endpoint enabled
- Security headers enhanced:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security with preload

### Wrangler Configuration (wrangler.jsonc)
- KV namespace binding: `METRICS_KV` → `jussray-metrics`
- Analytics engine dataset: `jussray_analytics`

### Test Suite (scripts/test-monitoring.mjs)
Comprehensive test coverage:
- Configuration validation (19 tests)
- HTTPS enforcement verification
- Security header verification
- CSP configuration verification
- All tests passing ✓

## Metrics Collection

**Data Storage:** KV namespace `jussray-metrics`
- Key format: `metrics:{ISO_HOUR}`
- Data includes:
  - Request count by status
  - Error tracking with path/time
  - Average latency calculations
  - Country/TLS version information
- TTL: 7 days
- Export format: JSON

## Testing

Run comprehensive monitoring tests:
```bash
node scripts/test-monitoring.mjs
```

**Test Results:** 19/19 passing
- Configuration files validated
- Wrangler setup verified
- Worker monitoring code confirmed
- HTTPS enforcement verified
- Security headers confirmed
- CSP with report-uri validated

## Network Topology

```
Public Internet
    ↓
jussco.company / www.jussco.company (Cloudflare CDN)
    ↓
Cloudflare Worker (jussray)
    ├→ src/index.ts (metrics + security)
    ├→ site/ (static assets)
    └→ KV METRICS_KV (analytics)
    ↓
Alert System
    ├→ Email (primary: juss)
    ├→ Webhook (alerts.internal/incidents)
    └→ Dashboard (monitoring/dashboard.html)
    ↓
fcr_mail Service
    ├→ Health checks
    ├→ Delivery tracking
    └→ SLA monitoring
```

## Manual Testing

### Test HTTPS Enforcement
```bash
curl -i http://jussco.company/
# Should redirect 301/302 to https://
```

### Test Security Headers
```bash
curl -I https://jussco.company/
# Verify: Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options
```

### Test CSP Report-uri
Monitor CSP violations at `/_csp-report` endpoint (requires CSP-Report-Only header or actual violation).

### Test Dashboard
Access production health dashboard:
- https://jussco.company/monitoring/dashboard.html

## Cloudflare Dashboard Configuration

**Required Setup in Cloudflare Dashboard:**

1. **SSL/TLS**
   - Certificate monitoring: Enable certificate alerts
   - Days before expiry: 30 days
   - Alert email: juss@example.com

2. **Workers**
   - Enable Workers Logs for "jussray"
   - Set up tail logs for debugging

3. **Analytics**
   - Enable Workers Analytics (view request trends)
   - Dataset: jussray_analytics

4. **Notifications**
   - Email notification rules (if using Cloudflare alerts)
   - Webhook integration (if available)

## Future Enhancements

- [ ] Integration with PagerDuty for critical escalations
- [ ] Custom Cloudflare Workers Analytics graphing
- [ ] Email delivery service (fcr_mail) health check automation
- [ ] Automated SSL certificate renewal alerts
- [ ] Real-time log streaming to external monitoring system
- [ ] Advanced analytics with AI anomaly detection
- [ ] Custom metrics for specific endpoints
- [ ] Performance budget tracking

## Runbook

### Certificate Renewal Alert
1. Juss receives email alert: "TLS Certificate expiring within 30 days"
2. Review certificate status in Cloudflare SSL/TLS dashboard
3. Initiate renewal process (usually automatic)
4. Test: Verify CSP and security headers post-renewal
5. Escalate HSTS max-age to 31536000 after verification

### fcr_mail Delivery Rate Drop
1. Critical alert triggered when delivery < 98%
2. Check fcr_mail health endpoint
3. Review queue depth and error logs
4. Check for rate limiting or service degradation
5. Escalation: Level 2 at 15 min, Level 3 at 30 min
6. Create incident ticket with severity P1

### High Error Rate Response
1. Alert triggered when error rate > 1%
2. Check src/index.ts logs in Cloudflare Workers
3. Review recent deployments
4. Check for resource exhaustion (KV quota, etc.)
5. Rollback if recent change caused spike
6. Investigate root cause

## Compliance

- **Data Retention:** Metrics retained 7 days in KV
- **PII:** No personally identifiable information logged
- **Audit Trail:** All alerts logged with timestamp, severity, and recipient
- **SLA Tracking:** fcr_mail SLA targets documented
- **Incident Response:** 3-level escalation policy with defined response times

---

**Last Updated:** 2026-10-18  
**Next Review:** 2026-11-18
