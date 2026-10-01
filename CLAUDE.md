# Claude Operating Contract — jussray/jussray

This repository is Juss's public front: the GitHub profile README plus the canonical Juss & Co runtime at `https://jussco.company`.

Juss & Co's public runtime is served by Cloudflare Worker `jussray` from `site/`. `wrangler.jsonc` is the deployment source of truth for the Worker name, static asset directory, Preview support, and the canonical custom domains `jussco.company` and `www.jussco.company`. GitHub Pages is not a deployment carrier or runtime authority for Juss & Co.

## What lives here
- `README.md` — the GitHub profile. Founder-authored; edit only on Juss's word.
- `site/` — the Juss & Co founder-studio site served by Cloudflare Worker `jussray`. `site/data/worlds.json` is the single source of per-world status, links, founder contacts and evidence.
- `docs/profile/`, `docs/index.html`, and `docs/picks/` — retained founder/profile, Juss Digital and picks source/history. They are not currently deployed by this repository and must not be treated as live-runtime evidence.
- `.github/workflows/site-proof.yml` runs `scripts/verify-site.mjs` (Playwright, three widths), validates Wrangler/domain truth, and verifies the canonical public domains on `main`. `revenue-page.yml` runs the existing `tests/*.spec.cjs`.

## Truth rules
- Every status, receipt and contact on the site is real. Founder-declared fields in `worlds.json` (`st`, `label`, `link`, `held`, `contact`) change only on Juss's word. `evidence.*` is written by Founder Control Room's `juss-and-co-status-sync` workflow from live GitHub state.
- Placeholders are written `[LIKE THIS]` and render as "pending". Never replace one with a guess.
- Se'kret Bip and StoryEngine get no public link until their front doors are live.
- Never delete or rewrite the existing profile, Juss Digital or picks source pages merely to make a runtime change easier.
- Do not treat a stale deployment workflow, historical URL, build artifact, or repository file as proof of current runtime state. Re-observe the canonical Cloudflare domains.

## Loop
Observe → smallest reversible change → exact-head browser/runtime proof → merge or direct-main mutation only with Juss's authority → re-observe production.
Report: REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE.
