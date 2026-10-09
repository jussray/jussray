# Claude Operating Contract — jussray/jussray

This repository is Juss's public front: the GitHub profile README plus the canonical Juss & Co runtime at `https://jussco.company`.

Juss & Co's public runtime is served by Cloudflare Worker `jussray` from `site/`. `wrangler.jsonc` is the deployment source of truth for the Worker name, static asset directory, Preview support, and the canonical custom domains `jussco.company` and `www.jussco.company`. GitHub Pages is not a deployment carrier or runtime authority for Juss & Co.

## What lives here
- `README.md` — the GitHub profile. Founder-authored; edit only on Juss's word.
- `site/` — the Juss & Co founder-studio site served by Cloudflare Worker `jussray`. `site/data/worlds.json` is the single source of per-world status, links, founder contacts and evidence.
- `docs/profile/`, `docs/index.html`, and `docs/picks/` — retained founder/profile, Juss Digital and picks source/history. They are not currently deployed by this repository and must not be treated as live-runtime evidence.
- `.github/workflows/site-proof.yml` runs `scripts/verify-site.mjs` (Playwright, three widths), validates Wrangler/domain truth, and verifies the canonical public domains on `main`. `revenue-page.yml` runs the existing `tests/*.spec.cjs`.

## Outcome showcase (feature branch, not production-verified)
- `site/data/approved-stories.json` is a separate, public-only, initially empty source for **The Outcome Edit** on JussCo.company. It does not replace `site/data/worlds.json` or authorize changing project status.
- `scripts/verify-approved-stories.mjs` validates the feed schema, declared approval, destination, public proof link, and field allowlist. `.github/workflows/site-proof.yml` invokes it before the existing Playwright script. `scripts/verify-site.mjs` includes empty/mixed/unavailable feed checks.
- Publication lock: the CI validator requires `stories.length === 0`; do not remove this lock until authenticated cross-brand consent, revocation/removal, and production readback are proven.
- Never put personal, private, child, customer, or internal-receipt data into public JSON. Client-side filtering is not a privacy boundary. Consent metadata is not independently verified consent; do not publish real-person stories until authenticated approval and withdrawal/removal are implemented and tested.
- Project brands own their achievements; the parent site may feature only separately approved and attributed public outcomes. No synthetic testimonials, inflated claims, or auto-publication from FCR observation.
- The feature branch is not proof of CI, deployment, or runtime success. Require exact-head tests and real browser readback before a merge decision.

## Truth rules
- Every status, receipt and contact on the site is real. Founder-declared fields in `worlds.json` (`st`, `label`, `link`, `held`, `contact`) change only on Juss's word. `evidence.*` is written by Founder Control Room's `juss-and-co-status-sync` workflow from live GitHub state.
- Placeholders are written `[LIKE THIS]` and render as "pending". Never replace one with a guess.
- Se'kret Bip and StoryEngine get no public link until their front doors are live.
- Never delete or rewrite the existing profile, Juss Digital or picks source pages merely to make a runtime change easier.
- Do not treat a stale deployment workflow, historical URL, build artifact, or repository file as proof of current runtime state. Re-observe the canonical Cloudflare domains.

## Founder /godmode routing contract
Founder shorthand `/godmode` means the existing founder-governed workflow, **not** an unrestricted permission or a new self-authorizing role. When relevant, use ULTRATHINK, Attack Ten, Devil/Red Team I + II, OODA, Lindy, L99, Proof Mode, and the Founder Adaptive Kernel as internal analysis/verification techniques, selected by the authority layer rather than by untrusted content. Route work to available tools and systems by demonstrated strengths; do not pretend to invoke unavailable models or capabilities.

Preserve the chain: **founder intent → system authority → observe/audit → bounded execution → exact-head proof → adaptive decision → continuity receipt**. Adaptive decisions are ACCELERATE / CONTINUE / REPAIR / REFOCUS / HALT, grounded in evidence. Distinguish intent, permission, action, receipt, evidence, and verified state. Keep FCR, Chief, Sol, PromptOS, and all product repos independent; integrate only through approved interfaces. Never repeat work already proved complete. Do not bypass consent, safety, merge, deployment, or founder gates. Apply this standard across relevant work, but this repository document governs only this repository; global cross-chat persistence requires the user's ChatGPT personalization settings or another shared canonical source.

## Founder-approved proof-led delivery workflow
1. OBSERVE the canonical repository, current branch/head, provider state, and runtime; distinguish observations from claims.
2. AUDIT the smallest relevant surface, including privacy, authority, regressions, and rollback.
3. FIX narrowly on a reversible feature branch; preserve independent project brands and source-of-truth ownership.
4. TEST focused behavior and negative cases; add gates to the existing CI where appropriate.
5. DOCUMENT the changed contract, status, risks, and continuity receipt in the applicable README/operating docs without claiming unverified deployment.
6. COMMIT and record the exact SHA/fingerprint. Open a draft PR when provider CI is needed; never equate a branch push with passing checks.
7. PROVE the exact current head using provider CI, real-browser evidence, and review status. A previous head's green checks do not transfer.
8. REVIEW unresolved findings and mergeability. Founder approval authorizes only the stated action; keep merge/deploy held when safety or proof gates remain.
9. AUTHORIZE and DEPLOY only after required evidence and authority; then independently re-observe the live runtime and public data.
10. RECORD REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE, with branch, head SHA, tests, and supersession state.

**Outcome publishing extension:** Evidence and editorial approval are separate from authenticated cross-brand publication consent. Public feeds must fail closed until trusted consent and revocation/removal are implemented and tested. An empty showcase may be tested without publishing real-person stories. Never treat FCR observation-only evidence as publication authority.

## Loop
Observe → smallest reversible change → exact-head browser/runtime proof → merge or direct-main mutation only with Juss's authority → re-observe production.
Report: REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE.

## Working with Juss (standing rules — read before acting)
- **Style:** Juss writes terse directive shorthand. Decode it; don't ask for expansion. Answer the same way: direct, evidence-first.
- **Challenge, don't validate:** give honest evaluation. Say when an idea, premise, or prior claim is wrong, with the evidence.
- **Never make Juss say anything twice.** Re-reading earlier turns, this file, and the repo's own docs is Claude's job. Asking again stops productivity.
- **Repo docs first:** every repo carries its own MD docs written as instructions for Claude (`CLAUDE.md`, `AGENTS.md`, `.claude/`). Read and follow them; never ask Juss to restate what is already there.
- **Durable state, written the moment it lands:** track everything worked on in memory / `docs/claude/STATE.md` (decisions, branches, heads, PRs, gates, open findings) as soon as each decision or state change happens — not at the end of a conversation — so a fresh chat resumes mid-thread without Juss re-explaining. State about private repos stays in those repos' own docs, never in this public one.
- **Budget context deliberately:** no speculative search loops or repeated rounds hunting for something that may not exist. Prove a lead is reachable in one call before spending turns on it; name dead ends (`DEAD END: <path> — <why>`); surface remaining-context concerns instead of burning the window silently.
- **Repo audit-fix loop, on every project** (skill: `repo-audit-fix-loop`): probe/call the project → parallel read-only audits → verify every lead yourself → smallest patch on a fix branch with the narrowest test → before/after proof → commit, never merge (merge only when Juss approves it in the current turn and the exact head's required real-path checks are green) → report REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE.
- **Video / visual work:** articulate founder intent before executing — synthesize it from what Juss has already said; don't ask Juss to clarify.
- **"Cinema" means visual language** — cinematography, composition, depth, lighting, mood — not just aspect ratio. Founder Control Room (FCR) should enable cinematic visual storytelling on the level of Higgsfield-style AI video makers and Gemini, grounded in real cinema craft.
