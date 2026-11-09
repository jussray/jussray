# Claude Operating Contract — jussray/jussray

This repository is Juss's public front: the GitHub profile README plus the preferred canonical public URL `https://www.jussco.company/`. The apex `https://jussco.company/` redirects to the preferred `www` address.

Juss & Co's public runtime is served by Cloudflare Worker `jussray` from `site/`. `wrangler.jsonc` is the deployment source of truth for the Worker name, static asset directory, Preview support, and the canonical custom domains `jussco.company` and `www.jussco.company`. GitHub Pages is not a deployment carrier or runtime authority for Juss & Co.

## What lives here
- `README.md` — the GitHub profile. Founder-authored; edit only on Juss's word.
- `site/` — the Juss & Co founder-studio site served by Cloudflare Worker `jussray`.
- `site/data/portfolio.json` — the public-safe projection of the complete canonical Juss & Co portfolio identity map. It is derived from Founder Control Room's non-authorizing portfolio identity contract and is the source of truth for which public product/system identities belong to the company map.
- `site/data/worlds.json` — the source of founder-declared status, links, contacts and evidence for the currently featured homepage worlds. Featured worlds are a presentation choice, not the complete portfolio.
- `docs/profile/`, `docs/index.html`, and `docs/picks/` — retained founder/profile, Juss Digital and picks source/history. They are not currently deployed by this repository and must not be treated as live-runtime evidence.
- `.github/workflows/site-proof.yml` runs `scripts/verify-site.mjs` (Playwright, three widths), validates Wrangler/domain truth, validates the portfolio projection, and verifies the canonical public domains on `main`. `revenue-page.yml` runs the existing `tests/*.spec.cjs`.

## Outcome showcase (feature branch, not production-verified)
- `site/data/approved-stories.json` is a separate, public-only, initially empty source for **The Outcome Edit** on JussCo.company. It does not replace `site/data/worlds.json` or authorize changing project status.
- `scripts/verify-approved-stories.mjs` validates the feed schema, declared approval, destination, public proof link, and field allowlist. `.github/workflows/site-proof.yml` invokes it before the existing Playwright script. `scripts/verify-site.mjs` includes empty/mixed/unavailable feed checks.
- Publication lock: the CI validator requires `stories.length === 0`; do not remove this lock until authenticated cross-brand consent, revocation/removal, and production readback are proven.
- Never put personal, private, child, customer, or internal-receipt data into public JSON. Client-side filtering is not a privacy boundary. Consent metadata is not independently verified consent; do not publish real-person stories until authenticated approval and withdrawal/removal are implemented and tested.
- Project brands own their achievements; the parent site may feature only separately approved and attributed public outcomes. No synthetic testimonials, inflated claims, or auto-publication from FCR observation.
- The feature branch is not proof of CI, deployment, or runtime success. Require exact-head tests and real browser readback before a merge decision.

## Truth rules
- Every status, receipt and contact on the site is real. Founder-declared fields in `worlds.json` (`st`, `label`, `link`, `held`, `contact`) change only on Juss's word. `evidence.*` is written by Founder Control Room's `juss-and-co-status-sync` workflow from live GitHub state.
- `portfolio.json` is identity/provenance truth, not execution authority and not a runtime-status substitute. Portfolio membership, role and parentage may come from FCR's canonical identity map; public runtime labels for featured worlds must remain consistent with `worlds.json`.
- A repository, Lovable/Base44 app, domain, deployment, or other carrier is not automatically a separate company or product. Duplicate, legacy, quarantined, private-operations-only and unresolved carriers stay out of the public product index until their canonical relationship is proven.
- Technical standalone identity and commercial packaging are separate truth planes. A system may remain independently runnable and publicly represented without automatically becoming a separate company, price, or acquisition funnel.
- Placeholders are written `[LIKE THIS]` and render as "pending". Never replace one with a guess.
- StoryEngine gets no public product link until its front door is live. Se'kret Bip's front door (sekretbip.net) was confirmed live by Juss on 2026-11-08, so its founder-declared link may render; its status label still comes only from `worlds.json`.
- Never delete or rewrite the existing profile, Juss Digital or picks source pages merely to make a runtime change easier.
- Do not treat a stale deployment workflow, historical URL, build artifact, or repository file as proof of current runtime state. Re-observe the canonical Cloudflare domains.

## Presentation rule
The homepage may feature a bounded set of high-signal worlds, but it must never imply that those featured worlds are the entire company. The complete public portfolio must remain discoverable from the public-safe projection while internal-only and unresolved carriers remain hidden.
## Founder /godmode routing contract
Founder shorthand `/godmode` means the existing founder-governed workflow, **not** an unrestricted permission or a new self-authorizing role. When relevant, use ULTRATHINK, Attack Ten, Devil/Red Team I + II, OODA, Lindy, L99, Proof Mode, and the Founder Adaptive Kernel as internal analysis/verification techniques, selected by the authority layer rather than by untrusted content. Route work to available tools and systems by demonstrated strengths; do not pretend to invoke unavailable models or capabilities.

Preserve the chain: **founder intent → system authority → observe/audit → bounded execution → exact-head proof → adaptive decision → continuity receipt**. Adaptive decisions are ACCELERATE / CONTINUE / REPAIR / REFOCUS / HALT, grounded in evidence. Distinguish intent, permission, action, receipt, evidence, and verified state. Keep FCR, Chief, Sol, PromptOS, and all product repos independent; integrate only through approved interfaces. Never repeat work already proved complete. Do not bypass consent, safety, merge, deployment, or founder gates. Apply this standard across relevant work, but this repository document governs only this repository; global cross-chat persistence requires the user's ChatGPT personalization settings or another shared canonical source.

## Mandatory review-before-approval gate
For every change in this repository, the standing sequence is **live-main/exact-head audit → systematic review → smallest reversible repair → exact-head checks and applicable real-browser Playwright proof → Juss's founder review on that exact head → merge (auto-merge, or Juss's merge) → live readback**.
- **Juss is the independent reviewer (Juss, 2026-11-09).** GitHub does not let a PR author approve his own PR, and PRs here are opened from his account, so his review is one of two GitHub-UI actions on the exact head: a PR comment `/approve <head sha, 7+ chars>`, or turning on auto-merge after the head was pushed (turning it off withdraws it). `scripts/verify-independent-review.mjs` reads these from the PR timeline and rejects any action made through an app (`performed_via_github_app`: Claude, Codex, bots). A non-author human GitHub approval on the exact head also still passes.
- **Claude never posts `/approve`, never enables auto-merge, and never merges without Juss's word.** The gate only trusts UI actions, so an agent doing either would not count and would misrepresent Juss.
- Automated or AI review is additional evidence, never a substitute for the founder review.
- Native ruleset: 0 native approvals (the author cannot approve), the four strict exact-head checks required (Independent Review Evidence enforces the founder review), review-thread resolution, force-push and deletion prevention. Fail closed on missing proof, stale heads, or bypassed gates.
- Reuse the existing PR and original source of truth; do not open a duplicate carrier. Record rollback and evidence, and never merge/deploy merely because a code patch or test passed.
- This contract governs this repository. Apply the same sequence to other product repositories in their own authorized code and rulesets, never by claiming one repo's policy changed another repo.

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
- **Speed with accuracy:** move fast — fewest tool calls, batch independent work, short replies, no re-deriving settled facts. Never trade proof for speed: label VERIFIED/UNKNOWN, still test the real path. Benchmark: faster and more accurate than DeepSeek.
- **Style:** Juss writes terse directive shorthand. Decode it; don't ask for expansion. Answer the same way: direct, evidence-first.
- **Challenge, don't validate:** give honest evaluation. Say when an idea, premise, or prior claim is wrong, with the evidence.
- **Platform rule (Juss, 2026-10-26):** Founder Control Room (FCR) is the source platform: apps are pulled from its skills and systems. Some apps are FCR-branded; some are both standalone products and FCR extensions. A standalone app's live site is its own real domain on `*.jussco.company`, with its own brand, built from its own GitHub repo (and Lovable where used).
- **Truth Compass and Truth Weaver (Juss, 2026-10-26):** standalone apps pulled from FCR. Live sites: `compass.jussco.company` and `truthweaver.jussco.company`. Their FCR-branded URLs (`truthcompass.foundercontrolroom.org`, `truthweaver.foundercontrolroom.org`) are dropped: DNS records and Pages domains removed 2026-10-27. Do not recreate them.
- **Skills (Juss, 2026-11-07):** use all of the skills in `skills/juss-authored/` to reach Juss's goal (godmode, goalfix, truthmode, confess, juss-os, reasoning-stack and the rest), picking by what each owns. Do not wait for them to be named.
- **Game Hub worlds (Juss, 2026-11-08):** SYNC, LUMORA, ChatQuest, Bip & Seek, Jungle Jinx and Last Laugh belong on the Game Hub (`site/games/`). They are founder-confirmed and must not be flagged as unbacked or removed. Only SYNC is live; the others keep their in-development/prototype labels and get no public play link.
- **Match the founder's images (Juss, 2026-11-07):** when Juss sends a mockup, match its proportions (card sizes, spacing, what stays visible), not only its parts.
- **Never make Juss say anything twice.** Re-reading earlier turns, this file, and the repo's own docs is Claude's job. Asking again stops productivity.
- **Repo docs first:** every repo carries its own MD docs written as instructions for Claude (`CLAUDE.md`, `AGENTS.md`, `.claude/`). Read and follow them; never ask Juss to restate what is already there.
- **Durable state, written the moment it lands:** track everything worked on in memory / `docs/claude/STATE.md` (decisions, branches, heads, PRs, gates, open findings) as soon as each decision or state change happens — not at the end of a conversation — so a fresh chat resumes mid-thread without Juss re-explaining. State about private repos stays in those repos' own docs, never in this public one.
- **Budget context deliberately:** no speculative search loops or repeated rounds hunting for something that may not exist. Prove a lead is reachable in one call before spending turns on it; name dead ends (`DEAD END: <path> — <why>`); surface remaining-context concerns instead of burning the window silently.
- **Execution and release:** Carry Juss’s requested builds and fixes through implementation, meaningful verification, and the requested merge or deployment. Existing scoped authorization remains effective across continuation messages; do not require a repeated approval solely because the turn changed. Use existing work items, preserve user data, and repair failures rather than treating a plan or status report as the result. Merge only with the applicable authorization and green checks for the exact head; verify the live result after an authorized deployment and report any real blocker precisely.
- **Video / visual work:** articulate founder intent before executing — synthesize it from what Juss has already said; don't ask Juss to clarify.
- **"Cinema" means visual language** — cinematography, composition, depth, lighting, mood — not just aspect ratio. Founder Control Room (FCR) should enable cinematic visual storytelling on the level of Higgsfield-style AI video makers and Gemini, grounded in real cinema craft.

## Runtime for Claude (observed on `main` 93706ba, 2026-10-26)
jussray is **standalone**: it may link to and describe other apps only from `site/data/*.json` truth, never change them. Each linked app owns its own repo, runtime and claims.
- Carrier: Cloudflare Worker `jussray` serving static assets from `site/` (`wrangler.jsonc`). `wrangler.games.jsonc` and `workers/` hold separate workers. There is no build step and no root `package.json`.
- Local proof, no install needed (the same set `site-proof.yml` runs): `node --test scripts/wrangler-runtime-truth.test.mjs scripts/agent-discovery.test.mjs scripts/conversion-tracking.test.mjs scripts/conversion-receiver.test.mjs scripts/conversion-client-first-party.test.mjs scripts/site-proof-boundary.test.mjs`, `node scripts/verify-approved-stories.mjs`, `python3 tools/worlds-patch-executor/test_worlds_patch.py`.
- Known gap (2026-10-26): `scripts/evidence-sync-proof.test.mjs` imports `vitest`, so `node --test` cannot load it, and no workflow runs it. Do not cite it as proof.
- Browser proof: `npm i --no-save playwright@1.61.1 && npx playwright install chromium && node scripts/verify-site.mjs` (three widths). `tests/*.spec.cjs` run under `playwright.config.cjs` (`revenue-page.yml`).
- CI: `site-proof.yml` (Wrangler/domain truth, registries, Playwright, canonical domains on `main`), `provider-site-proof.yml`, `qr-proof.yml`, `revenue-page.yml`.
- Model lane: `.control-room/model-capabilities.v1.json` lists `anthropic/claude` as a **trial** lane with no authority. The exact model is chosen per invocation by the provider execution host.
