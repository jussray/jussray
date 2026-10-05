# Claude session state — public portfolio

Written the moment state changes. Newest first. Private-repo state lives in that repo's own `docs/claude/STATE.md`.
Labels: VERIFIED (seen: run/log/diff) · INFERRED · UNKNOWN · BLOCKED.

## 2026-10-05

### chief-ai-machine — Chief edge defense regression
- VERIFIED: #141 reconcile merge `07e2d31` (2026-10-04) reverted `wrangler.jsonc`: Worker main `security/chief-edge-entry.js` → `worker/index.js`, `CHIEF_RATE_LIMITER` binding removed, `/api` `/github` dropped from `run_worker_first`. Reciprocal Defense Contract red on main since (runs #27, #28).
- VERIFIED: fix = PR #205 `security/restore-chief-edge-wiring` @ `e19b9fc` (byte-identical restore + test + 2 lint fixes). Local: lint clean, 687 tests, Playwright witness fails on main / passes on head.
- VERIFIED: Reciprocal Defense Contract **green** on `e19b9fc` (run 37352429735, manual dispatch — the push never triggered it), incl. Playwright witness through wrangler. Workers Builds preview deploy of `e19b9fc` succeeded.
- BLOCKED, not merged (`mergeable_state: blocked`). 6 red checks, none a defect in the PR diff:
  - red on main too @ `ba81a9b`: Operational Proof Contract (video-renderer workflows lack superseded-run cancellation), Quality Gate Typecheck (`node:*` types in `src/domain/video-renderer.js`), Test Ledger (rollup).
  - Governance Boundary: workflow bug — on `pull_request`, `GITHUB_SHA` (merge ref) ≠ `RELEASE_SHA` (head) → bake script refuses. One-line fix proposed on PR (`env -u GITHUB_SHA`); applying it was refused by the session's CI-bypass guard → needs Juss.
  - ProofMode MCP Playwright + Required Check Materializer: preview proof 302 → Cloudflare Access. Founder decision on Access for previews.
- OPEN findings (not fixed): decoy unreachable for `/.env`-style paths (asset fallback answers first); defense check not a required status check; `.assetsignore` gaps; full-attack-unit checks partly constant; Node path trusts `x-forwarded-for`; policy vs binding limit mismatch.
- Stale branch `fix/restore-chief-edge-wiring` left on origin (proxy refused delete) — same commit, safe to delete.

### jussray — worlds-patch-executor
- VERIFIED gap: a patch can be READY while an upstream world's own required check is failing (only queued upstream patches were considered). Fix on branch `docs/claude-founder-working-rules`.

### Decisions
- Founder working rules recorded in `CLAUDE.md` (this branch).
- ultrathink-devil: not a new skill (≈70% duplicates ULTRATHINK- `reasoning-stack` Redteam/Lindy twins + juss-os law 1). Unique parts (consequence classes, planes, adaptive budget, ≤3 options) are being made executable in the private product repo. Pasted source was truncated after "Can a mode or untrusted" — remainder UNKNOWN.
- Drift to resolve (founder decision): two juss-os versions exist — installed skill (79-line kernel, v3-DRAFT) vs `ULTRATHINK-` repo (110-line kernel). Neither recorded as FOUNDER ACCEPT.
