# Claude Operating Contract — jussray/jussray

This repository is Juss's public front: the GitHub profile README plus the canonical Juss & Co runtime at `https://jussco.company`.

Juss & Co's public runtime is served by Cloudflare Worker `jussray` from `site/`. `wrangler.jsonc` is the deployment source of truth for the Worker name, static asset directory, Preview support, and the canonical custom domains `jussco.company` and `www.jussco.company`. GitHub Pages is not a deployment carrier or runtime authority for Juss & Co.

## What lives here
- `README.md` — the GitHub profile. Founder-authored; edit only on Juss's word.
- `site/` — the Juss & Co founder-studio site served by Cloudflare Worker `jussray`.
- `site/data/portfolio.json` — the public-safe projection of the complete canonical Juss & Co portfolio identity map. It is derived from Founder Control Room's non-authorizing portfolio identity contract and is the source of truth for which public product/system identities belong to the company map.
- `site/data/worlds.json` — the source of founder-declared status, links, contacts and evidence for the currently featured homepage worlds. Featured worlds are a presentation choice, not the complete portfolio.
- `docs/profile/`, `docs/index.html`, and `docs/picks/` — retained founder/profile, Juss Digital and picks source/history. They are not currently deployed by this repository and must not be treated as live-runtime evidence.
- `.github/workflows/site-proof.yml` runs `scripts/verify-site.mjs` (Playwright, three widths), validates Wrangler/domain truth, validates the portfolio projection, and verifies the canonical public domains on `main`. `revenue-page.yml` runs the existing `tests/*.spec.cjs`.

## Truth rules
- Every status, receipt and contact on the site is real. Founder-declared fields in `worlds.json` (`st`, `label`, `link`, `held`, `contact`) change only on Juss's word. `evidence.*` is written by Founder Control Room's `juss-and-co-status-sync` workflow from live GitHub state.
- `portfolio.json` is identity/provenance truth, not execution authority and not a runtime-status substitute. Portfolio membership, role and parentage may come from FCR's canonical identity map; public runtime labels for featured worlds must remain consistent with `worlds.json`.
- A repository, Lovable/Base44 app, domain, deployment, or other carrier is not automatically a separate company or product. Duplicate, legacy, quarantined, private-operations-only and unresolved carriers stay out of the public product index until their canonical relationship is proven.
- Technical standalone identity and commercial packaging are separate truth planes. A system may remain independently runnable and publicly represented without automatically becoming a separate company, price, or acquisition funnel.
- Placeholders are written `[LIKE THIS]` and render as "pending". Never replace one with a guess.
- Se'kret Bip and StoryEngine get no public product link until their front doors are live.
- Never delete or rewrite the existing profile, Juss Digital or picks source pages merely to make a runtime change easier.
- Do not treat a stale deployment workflow, historical URL, build artifact, or repository file as proof of current runtime state. Re-observe the canonical Cloudflare domains.

## Presentation rule
The homepage may feature a bounded set of high-signal worlds, but it must never imply that those featured worlds are the entire company. The complete public portfolio must remain discoverable from the public-safe projection while internal-only and unresolved carriers remain hidden.

## Loop
Observe → smallest reversible change → exact-head browser/runtime proof → merge or direct-main mutation only with Juss's authority → re-observe production.
Report: REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE.
