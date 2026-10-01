# Claude Operating Contract — jussray/jussray

This repository is Juss's public front: the GitHub profile README plus the pages served at https://jussray.github.io/jussray/.

Juss & Co's founder-declared canonical public domain is `https://jussco.company`. Until DNS and host routing are independently verified, `jussray.github.io/jussray/` remains the verified deployment carrier rather than proof that the custom domain is live.

## What lives here
- `README.md` — the GitHub profile. Founder-authored; edit only on Juss's word.
- `site/` — the Juss & Co founder-studio site, served at the Pages root. Single page, no build. `site/data/worlds.json` is the single source of per-world status, links, founder contacts and evidence.
- `docs/profile/` → `/profile/` (founder profile, canonical URL kept), `docs/index.html` → `/digital/` (Juss Digital offers), `docs/picks/` → `/picks/`.
- `.github/workflows/pages.yml` deploys all of the above on push to `main`. `site-proof.yml` runs `scripts/verify-site.mjs` (Playwright, three widths) on every site change; `revenue-page.yml` runs the existing `tests/*.spec.cjs`.

## Truth rules
- Every status, receipt and contact on the site is real. Founder-declared fields in `worlds.json` (`st`, `label`, `link`, `held`, `contact`) change only on Juss's word. `evidence.*` is written by Founder Control Room's `juss-and-co-status-sync` workflow from live GitHub state.
- Placeholders are written `[LIKE THIS]` and render as "pending". Never replace one with a guess.
- Se'kret Bip and StoryEngine get no public link until their front doors are live.
- Never delete or rewrite the existing profile, Juss Digital or picks pages to make a change easier.

## Loop
Observe → smallest reversible change on a `feat/*` or `fix/*` branch → `node scripts/verify-site.mjs` (and `npx playwright test` for docs pages) → PR → merge only on Juss's exact-head approval.
Report: REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE.
