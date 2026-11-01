# Juss & Co — dynamic public truth and guarded Cloudflare delivery

Status: **AUTHORED on fix branch**. Not a claim of live deployment or passing GitHub CI.

## Sources of truth (three distinct layers)

1. `site/data/worlds.json` is founder-declared editorial state: visibility, product stage, public links, contact addresses, and approved public descriptions. These are **not** auto-inferred from code commits.
2. Founder Control Room already owns the six-hour `portfolio-evidence-sync.yml` workflow and `scripts/sync-jussco-portfolio-evidence.mjs`. It observes source repositories, applies evidence-only updates to the two registry JSON files, and preserves founder-controlled fields. The source exists; operational credentials and successful real production sync must be independently verified. An October 6 source receipt reports `APP_PRIVATE_KEY_SHAPE_INVALID`; that is **last-known historical evidence**, not a freshly reproduced failure. Do not copy credentials into this repository.
3. `workers/public-evidence.mjs` serves `/api/public-evidence` on canonical Cloudflare hostnames. It fetches only allowlisted, publicly visible repository commit summaries and caches them at the edge for 30 minutes. It does **not** have authority to update founder labels, commerce claims, credentials, private app data, or publish stories. If GitHub fails, it omits the observation. The browser keeps the authored registry as fallback.

The homepage labels its registry date as a **snapshot**, never a successful live verification timestamp. Public source activity is separately labeled **not a deployment**.

## Automation and safe releases

- `.github/workflows/site-proof.yml`: required public source tests, registries, security and browser checks. New dynamic evidence contract tests run here.
- `.github/workflows/deploy-jussco.yml`: after a successful exact-main `site-proof` workflow, checks exact SHA against latest `main`, requires all visible GitHub check runs and external commit statuses green, and refuses if evidence is missing or incomplete. Secrets are read only in the protected production job. Deploys the narrow public evidence Worker and then the canonical `jussray` assets Worker **on Cloudflare**, not Vercel.
- `.github/workflows/provider-site-proof.yml`: runs production readback **after** the deployment workflow succeeds, not before it. Its independent browser proof can still fail due to a provider challenge or genuine runtime problems; do not reinterpret this as success.
- Required GitHub configuration before an actual release: secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` scoped to Juss & Co Cloudflare deployment, environment `jussco-production` with applicable founder controls, required exact-head CI checks and branch protection. Never store token values in source. No PR or automatic merge is part of this change.
- FCR evidence-sync authorization is separate from this site's deploy credentials. Do not grant a public Worker FCR or GitHub write access.

## Privacy and security boundaries

No visitor identifier, user fingerprint, session, private repository metadata, child/customer information, internal prompt, or token is sent in public evidence JSON. Responses contain source repository path, commit SHA, commit timestamp, and explicit `public_source_commit_only` scope. Visitors are not sent directly to a GitHub API: the browser calls a first-party Cloudflare path. Cache failures, absent proof, and unavailable upstream systems never change product launch or sales status.

## FutureYou/Me failure table

| Failure | Result | Action |
| --- | --- | --- |
| FCR GitHub App token missing/invalid | Evidence registry stays last known; no invented freshness | Repair FCR production secret via authorized secret channel, then re-observe sync receipt |
| Public GitHub rate limit/outage | Dynamic source feed partial/empty | Do not infer repository inactivity or release failure |
| Source CI red or pending | No Cloudflare release | Fix exact failing check and retry against current main |
| Missing Cloudflare deploy token | No deployment | Configure scoped production secret; do not bypass checks |
| Cloudflare deploy succeeds but browser proof fails | Deployment occurred; live outcome unverified | Investigate route, page, cache, receiver and runtime; roll back only with founder authorization |
| Unapproved outcome/customer story | Feed remains empty | Require authenticated source consent, revocation, and public proof before publication |
| FCR status sync writes registry when main changed | Exact-head conflict or gate failure | Preserve both source histories; reconcile, do not force-update main |

## Evidence standard and rollback

Receipt should include exact repository, branch, SHA, UTC timestamp, affected blob SHAs, tests and outcome status. This branch's source checks are not evidence of a live deployment. Compare Cloudflare Worker deployment/version IDs and the canonical pages' exact source bytes after any authorized release. To roll back, select the last separately verified production Worker versions and restore prior route assignments in Cloudflare only after founder approval; never delete historical evidence or customer data as part of rollback.

No public project is automatically promoted to `Live` just because its GitHub branch advanced. `main` passing is not an order, product launch, signed customer consent, or payment confirmation.
