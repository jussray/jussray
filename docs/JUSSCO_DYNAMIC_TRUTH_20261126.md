# Juss & Co: current-main dynamic truth patch — 2026-11-26

Status: AUTHORED on review branch. A branch push is not merge, CI proof, deployment or live readback.

## Why this differs from the obsolete branch
Previous branch `fix/futureme-jussco-truth-deploy-20261101` was observed 247 commits behind current main. Do not merge its old homepage or release workflow over the newer cinematic Juss & Co layout. This patch is based on main `14f8da150cf88079f335bb780cba334403e8cd67`.

## Three independent data planes
- **Founder-authorized portfolio truth:** `site/data/worlds.json` supplies featured-world public status, links and contact routing; `site/data/portfolio.json` supplies public-safe canonical product identity. Both must agree for the same product. They do not infer readiness from commits.
- **Public code observations:** isolated `workers/public-evidence.mjs` reads only the current public commit SHA and timestamp of nine allowlisted GitHub repositories. JSON outputs only source name, repo, SHA, timestamp and `public_source_commit_only` marker; it does not read private repositories or expose internal evidence. Cache TTL 15 minutes; upstream failure omits the affected source without modifying status.
- **Runtime and commercial proof:** live deployment, purchase, checkout, launch, account access and user journeys are separate receipts. A code commit never changes `st`, `label`, `publicLabel`, `portfolioStatus`, or public links.

## Implemented source changes
- Correct the unverified `Store open · awaiting first order` claim in both registries and the portfolio static snapshot.
- Use already-founder-declared public front doors for Se'kret Bip and SYNC in the canonical portfolio.
- Keep the current cinematic homepage, its public ecosystem carousel and its source-of-truth loader.
- Add optional, read-only public source annotations to the homepage, portfolio and deep Universe. When the API is unavailable, the authored registry remains visible and no product status changes.
- Remove stale, unsupported status and checkout fallback claims from the deep Universe.
- `scripts/portfolio-dynamic-truth.test.mjs` checks safety, response shapes, status consistency and unchanged release authority. The existing site-proof CI invokes these tests.

## Cloudflare delivery (held until release gates)
- **Do not replace the existing `jussray` Worker or its Workers Builds Git integration.** It already owns the company domain and static assets.
- A separate Worker `jussco-public-evidence` is designed only for narrow routes at `jussco.company/api/public-evidence*` and `www.jussco.company/api/public-evidence*`. The handler denies all other paths and methods.
- `public-evidence-release.yml` runs only after successful exact-main `site-proof`, confirms current branch SHA and all visible check/status results, and deploys only when the Worker source/config changed. It then requires an independent public API response. If token, approval, check or Cloudflare challenge prevents verification, report BLOCKED rather than calling deployment verified.
- Required configuration: production environment `jussco-production` with founder gates, scoped `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` secrets. Never put secrets in client assets or source. Any new Cloudflare route requires explicit production release authority through the project's existing gates.
- Existing site Worker deployment mechanism must be inspected separately for active `wrangler deploy` vs `wrangler versions upload`. Source-only code does not prove that Workers Builds promotes a new version.

## Separate remaining blocker: Founder Control Room evidence sync
The pre-existing FCR `portfolio-evidence-sync.yml` is scheduled every six hours and is designed to update evidence only. The current Juss & Co `worlds.json` and `systems.json` inspected in this sprint have no populated evidence. Older FCR state records `APP_PRIVATE_KEY_SHAPE_INVALID`, but this is historical, not current job proof. Inspect FCR's latest job before rotating secrets. Do not grant the public Worker FCR authority, private-repository access or GitHub write permission.

## Exact release verification
1. Review branch diff and pass required exact-head checks including the existing Playwright source/browser suite.
2. Obtain the founder's review action on the same PR head. No bypass or agent-authored approval.
3. After merge, inspect deployed `jussray` version and independent `jussco-public-evidence` route, then perform public GET readback of the homepage, both JSON registries, and the new API endpoint.
4. Keep current status as UNKNOWN until provider and browser evidence supports the required claims.
5. Rollback: restore the previously verified Worker version/route and previous registry label commit with founder authorization. Never destroy evidence history, customer records or other Workers.
