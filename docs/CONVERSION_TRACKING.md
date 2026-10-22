# Juss & Co conversion-event tracking — review candidate

## Scope

Source: `jussray/jussray` / `site/` (Cloudflare Worker `jussray` serves `jussco.company` and `www.jussco.company`).
This change adds a browser-only, opt-out-aware *intent* signal using the site's existing Cloudflare Zaraz injection. The script sends no personal information, free text, cookies, identifiers, or destination URLs. A tracking receiver is **not** configured by this PR and production events are **not** verified.

| Event | Trigger | Counts | Never claim |
| --- | --- | --- | --- |
| `contact_click` | Email link or Copy Email action | Attempted contact | Message sent, lead qualified |
| `world_detail_open` | World card opened | Portfolio interest | Site visited |
| `project_open` | World drawer CTA, except JBH shop | Navigation intent | Project site actually loaded |
| `app_open` | Standalone system or Games link | App navigation intent | Signup or active user |
| `shop_click` | Juss Beautiful Hair link (including world CTA) | Shop navigation intent | Purchase |
| `call_click` | Telephone link, when available | Call intent | Connected call |
| `whatsapp_click` | WhatsApp link, when available | Chat intent | Message delivered |

The `zaraz.track()` schema is fixed to `project: 'juss-and-co'`, `surface: 'front_door'`, `action` from a fixed vocabulary, and `schema: 'v1'`. No raw `href`, URL parameters, email addresses, phone numbers, user text, names, account IDs, sessions, or browser fingerprints.

Global Privacy Control (`navigator.globalPrivacyControl`) and Do Not Track are honored. The script never blocks clicks, and tracking exceptions are swallowed to preserve navigation. Cloudflare or any eventual analytics provider may independently process network metadata. Validate applicable privacy notices, disclosures, and consent requirements before enabling a destination.

## Proof and release gates

1. Run `node --test scripts/conversion-tracking.test.mjs` to verify event classification, strict props, GPC/DNT suppression, spoofed hostnames, and failure isolation.
2. Run the existing Chromium site proof `node scripts/verify-site.mjs` on the candidate; the script now includes event instrumentation readback in Chromium.
3. Observe exact PR head SHA and all required GitHub checks. Do not promote tests on a former commit to current proof.
4. Cloudflare Zaraz was observed with `autoInjectScript: true`, but **zero configured destination tools** as of 2026-10-22. Do not call this production conversion reporting until a privacy-reviewed sink is configured, events are verified at the receiver, and the current deployed script responds HTTP 200 with JavaScript MIME.
5. Merge, Cloudflare deployment, provider changes, and publishing are separate authority gates; this review candidate does not execute them. Rollback is removal of the one HTML script reference; the JS file and tests can then be removed in a follow-up.

## Later project-specific expansion

- Pappa Razzy Laundry Service: `call_click`, `whatsapp_click`, `pickup_request` on a *validated accepted* request, and `directions_click`.
- Juss Beautiful Hair: `product_view`, `add_to_cart`, `checkout_started`, `purchase_completed` on server-verified fulfillment/checkout receipt, never a button click.
- PromptOS / StoryEngine: `tool_open`, `signup_completed`, `trial_started`, `purchase_completed` only when actual backend status supports it.
- Se'kret Bip family: do **not** collect behavioral conversion profiling for minors or their journals, chats, health, mood, or companion interactions. Any allowed aggregate service-health instrumentation must be separate and privacy-reviewed.

## Authority and truth

Repository source is not a deployed website; a passing CI job is not production; front-door intent is not downstream conversion; analytics collection is not consent. Do not infer any of those from this PR.


## First-party aggregate receiver — subsequent review branch

The existing PR #38 implementation merged to `main` at `7b08424ba80d094898feae071a9bd1b6e78a1de1`. The follow-on branch `feat/jussco-first-party-conversion-receiver` adds:

- `workers/conversion-receiver.mjs`: a separately deployed same-origin Cloudflare Worker at `https://www.jussco.company/_telemetry/v1`. It accepts only an exact 5-field schema and a fixed event/action allowlist. POST requires the canonical Origin and fails closed for cross-site requests, bad content types, oversized bodies, bad event/action pairs, missing database bindings and DB failures.
- `site/assets/conversion-tracking.js`: sends that fixed-schema event via same-origin `fetch` with `credentials: omit` and `keepalive: true`, while honoring GPC and DNT. The old Zaraz observer remains pending its destination policy; **do not configure a second downstream consumer for the same events without deduplication**. The first-party HTTP acceptance is still only a click-intent measurement, never a signup/purchase proof.
- `workers/conversion-schema.sql`: D1 stores *daily UTC aggregate counts only*. It stores only `day`, `event`, `action`, `count`. There is no per-person or per-event event log, no IP, referer, user agent, session ID, user key, browser fingerprint, URL, query, or message body column.
- `wrangler.conversions.example.jsonc`: separate Worker, separate D1 binding; the placeholder DB ID must never be passed to production. Do not touch or replace the existing `jussray` website Worker.
- `scripts/conversion-receiver.test.mjs` and `scripts/conversion-client-first-party.test.mjs`: contract/security, GPC/DNT, and failure behavior.

**Private report query (authenticated Cloudflare D1 query, not a public endpoint):**

```sql
SELECT day, event, action, count FROM conversion_daily
WHERE day >= date('now', '-30 days')
ORDER BY day DESC, event, action
LIMIT 500;
```

A frontend click is a *signal*, not a deduplicated human, qualified lead, WhatsApp message, or financial outcome. No private or user-level details should be added to these metrics. Spoofable client-originated activity is not trusted proof; protect against abuse and monitor anomalies before treating counts as reliable.

**Release gates:** Exact-head CI (including receiver tests), fresh source/PR review, dedicated D1 creation and id binding, no-risk Worker script upload, route scope verification for `www.jussco.company/_telemetry/v1*`, separately authorized merge/site deployment, live endpoint negative tests, test fixture with count readback, and report aggregation. Do not present a source PR as collection actually running. Rolling back the route stops all collection while leaving the static site intact. The D1 records and schema are never deleted as an implied rollback.
