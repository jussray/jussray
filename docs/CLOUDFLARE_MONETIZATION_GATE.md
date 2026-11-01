# Juss & Co — Cloudflare monetization release gate

**State (2026-10-31): HELD / NOT LIVE.** This document is source intent, not a Cloudflare billing change, legal agreement, verified payment, or proof of a premium API.

## Provider observations

- The connected Cloudflare account returned an **active** `jussco.company` zone on its Free Website plan.
- Cloudflare's documented Monetization Gateway limit is **USD 100 per request** (`100000000` atomic units for a six-decimal payment token). The proposed fixed-price maximum lives in `config/cloudflare-monetization-gate.json`.
- The authenticated `GET /zones/{zone_id}/monetization/rules` request returned HTTP 404, error 10005, `payment rule not found`. This does **not** prove enrollment, absence of any other provider billing system, or that all future access is impossible.
- The latest observed `jussray` Worker deployment was created `2026-10-30T15:34:03.291791Z`. This proves only the deployment record, not which licensing content is served.
- No receiving wallet, seller eligibility, eligible paid endpoint, or origin-side signed JWT payment validation was independently verified.

## Boundaries

1. Public website assets and machine-readable discovery remain free. Do not attach broad wildcard payment rules to the public Juss & Co website or to other brands' sites.
2. Add a rule only for a **real, isolated premium API, premium dataset, or approved premium MCP endpoint** with independently verified rights and an authenticated origin. Do not invent endpoints.
3. Never expose private customer data, children/teens/family information, private messages, credentials, payment records, operational prompts, security configuration, or unreleased internal architecture as billable content.
4. For Monetization Gateway, validate `PAYMENT-CONTEXT` JWT at the origin using a pinned Cloudflare JWKS, expected issuer/audience where documented, valid time and signatures. Missing or invalid payment context is **unpaid**; do not serve premium content or set a settlement header. Never rely on a client-supplied unverified header.
5. Pay Per Crawl is a **different product**; default zone pricing and any dynamic `crawler-price` behavior remain inactive pending beta eligibility, crawler selection, free-discovery exemptions, and payment readback.
6. The proposed **USD 1,500 per month training license** is separate from x402 and crawl access. It requires verified content ownership, an executed written license, the correct selling legal entity, delivery/retention terms, and any required compliance approval before checkout.
7. Never use `PUT /zones/{zone_id}/monetization/rules` with a partial set: Cloudflare treats the body as a **full replacement** and omitted rules are deleted. Re-read existing rules before any authorized change.

## Release proof, in order

- Provider eligibility and valid seller authorization.
- Verified ownership of receiving wallet and selling entity.
- Named, independently observed premium resource with a narrow exact-match request expression.
- Origin-side cryptographically verified payment context and no direct-origin bypass.
- Positive paid request, negative unsigned/forged/missing-payment cases, correct settlement, rate/abuse controls, and no impact on public routes.
- Explicit founder release approval, exact source SHA, passing CI, Cloudflare provider readback, and a tested rollback plan.

## Repo receipt

Source repository: `jussray/jussray`, feature branch `feat/cloudflare-monetization-gate-20261031`. The original `site/` content, Cloudflare routing, and payment rules were not changed by this feature branch. This source-only preparation does not enable billing.
