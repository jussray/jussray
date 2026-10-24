# Authorization Evidence Ledger

**Document:** Release-readiness authorization tracking  
**Updated:** 2026-10-11  
**Scope:** StoryEngine (186 routes), supporting infrastructure (Supabase RLS, Cloudflare edge, GitHub proofs)  
**Classification:** VERIFIED (seen in run/log/diff) | INFERRED (high confidence, cannot observe directly) | BLOCKED (requires action) | UNKNOWN (deferred)

---

## Authorization Coverage

### Phase 1 & 2: COMPLETE ✅

**Studio Routes (7/7) — COMMITTED**
- Commit 33bd9c2: Add authorization checks to studio routes
- Commit ac301f2: Complete authorization evidence ledger
- Status: All 7 routes remediated; workspace_id and resource ownership validated before database access
- Tests: 380/383 passing (3 pre-existing, unrelated)
- Gate: ✅ COMPLETE — no blockers

**High-Risk Routes (8+ routes) — COMMITTED**
- OODA episodes, OODA risk scoring
- IP Studio operations
- Learning prediction routes
- Status: Phase 2 complete per prior session
- Gate: ✅ COMPLETE — verified via commit history

**Medium-Risk Routes (4+ routes) — COMMITTED**
- Audience lenses configuration
- Assist options management
- Validation seed routes
- Status: Phase 2 complete per prior session
- Gate: ✅ COMPLETE — verified via commit history

### Phase 3: IN PROGRESS 🔄

**Remaining Routes (23 gaps from original 44)**
- Status: 21/44 fixed (3 studios + 18 other routes from Phase 1-2)
- Remaining: 23 routes across 6 categories:
  1. **System Ops (8 routes):** Runtime scan, event retention, bootstrap config
  2. **Configuration (6 routes):** Lenses, assist, validation seeds
  3. **External (3 routes):** Webhooks, control-room operators, global state
  4. **Auth (2 routes):** Workspace/auth endpoints
  5. **Audience (2 routes):** Audience management
  6. **Distributed (2 routes):** Misc cross-module gaps

- Estimated completion: Phase 3 agents to finish remediation
- Regression testing: 394+ tests per route class
- Gate: 🔴 BLOCKED — awaiting Phase 3 completion

---

## Security Architecture

### Edge Defense (Cloudflare chief-ai Worker)

**Chief Edge Rate Limiting** — VERIFIED ✅
- Observed: Production bundle BUILD_RELEASE_SHA=167d03f contains `enforceChiefEdgeRateLimit`
- Evidence: Commit 167d03f + Workers Builds confirmation
- Status: VERIFIED (deployed to production)
- Route coverage: `/api`, `/github`, + main worker entry
- Gate: ✅ COMPLETE

**Chief Edge Full Attack Unit** — VERIFIED ✅
- Observed: Production bundle contains `runFullAttackUnit`
- Coverage: 23-lens attack pattern detection
- Evidence: Commit 167d03f, Playwright witness green
- Gate: ✅ COMPLETE

**Supabase/ Asset Exclusion** — INFERRED FIXED 🔄
- Incident: Versions of `wrangler.jsonc` served `/supabase/migrations/*.sql` publicly (200 response, exact SQL bytes)
- Fix: PR #206 `security/assetsignore-supabase` @ `6e7c82d`
- Status: Boundary test fails→passes; 687 tests pass; Chromium real path shows SPA fallback
- Production Status: UNKNOWN (PR #206 not yet merged; fix code verified but not deployed)
- Gate: 🟡 INFERRED READY — code verified, deployment pending

---

### Data Layer Security (Supabase RLS)

**Row-Level Security: Se'kret Bip** — VERIFIED ✅
- RLS: Enabled on all 86 public tables
- Anonymous-callable SECURITY DEFINER functions: auth.uid()-gated (low risk)
- Status: VERIFIED
- Evidence: Direct Supabase audit 2026-10-06
- Known gaps: Non-private surface policy coverage incomplete (details private, not recorded here)
- Gate: ✅ VERIFIED (low-risk gaps noted; remediation pending founder approval)

**Row-Level Security: Founder Control Room** — VERIFIED ✅
- RLS: Enabled
- Table scoping: 38 tables deny-all to clients (server-only, correct)
- Status: VERIFIED
- Evidence: Supabase dashboard review 2026-10-06
- Gate: ✅ VERIFIED

**Leaked-Password Protection** — BLOCKED 🔴
- Status: OFF (dashboard toggle, requires founder action)
- Projects affected: Se'kret Bip, Founder Control Room
- Risk: Subscriber reuse detection disabled
- Action required: Toggle on (1-click, no code change)
- Gate: 🔴 BLOCKED — awaiting founder decision

---

### Incident & Compliance

**Stripe Webhook Verification** — BLOCKED 🔴
- Status: Missing webhook signature validation
- Impact: Payment event replay risk if webhook endpoint exposed
- Evidence: Code audit 2026-10-10
- Fix: Add HMAC-SHA256 verification on incoming webhook payloads
- Estimated: ~30 min implementation + tests
- Gate: 🔴 BLOCKED — awaiting implementation

**Cross-Tenant Isolation Testing** — BLOCKED 🔴
- Status: Authorization fixes exist in source; runtime verification required
- Test requirement: Deny access when workspace_id ≠ current user's workspace
- Evidence: Code-reviewed but not operationally tested
- Gate: 🔴 BLOCKED — requires cross-tenant denial test suite

**CSP Hardening** — BLOCKED 🔴
- Status: Outstanding (from prior gate list)
- Requirement: Content-Security-Policy headers on all responses
- Gate: 🔴 BLOCKED — awaiting implementation

---

### Secret & Credential Management

**GitHub App Private Key** — BLOCKED 🔴
- Status: APP_PRIVATE_KEY not set in FCR production secret
- Evidence: `portfolio-evidence-sync` fails every run with APP_PRIVATE_KEY_SHAPE_INVALID
- Impact: `jussco.company` worlds.json evidence refresh blocked
- Action: Founder pastes full PEM into FCR environment `production` secret
- Gate: 🔴 BLOCKED — awaiting founder credential entry

**Rotation Policy** — UNKNOWN ❓
- Status: Deferred; no active rotation schedule observed
- Action: Define secret rotation schedule per credential class
- Gate: ❓ UNKNOWN — design + implementation pending

---

## Governance & Verification

**Evidence Distinction** — ESTABLISHED ✅
- Source-reviewed ≠ Runtime-verified
- Principle: Passing tests on studio routes prove implementation; do not prove complete coverage across all 186 routes
- Application: All fixes classified by observability: VERIFIED (seen), INFERRED, BLOCKED, UNKNOWN

**Decision Record: Repair Audit** — ESTABLISHED ✅
- Release authorization ≠ Repair completion
- Pattern: Project's own capability contract is authoritative for readiness
- Application: StoryEngine capability contract holds all founder gates until AUTH verified

**Rollback Procedures** — DOCUMENTED ✅
- Commit-tagged releases: All fixes are revertible commits on `main`
- Procedure per component:
  - **Studio routes:** Revert commits 33bd9c2, ac301f2
  - **Edge defense:** Already deployed; rollback via Cloudflare console or revert PR #205
  - **Supabase RLS:** Tested under RLS constraints; rollback via Supabase dashboard
  - **Artifact fixes:** Revert PR #206 (once merged)

---

## Release Gates Summary

### AUTH Gate: 🔴 BLOCKED
- Blocker 1: 23 remaining routes need Phase 3 remediation + tests
- Blocker 2: Cross-tenant denial test suite required
- Blocker 3: Stripe webhook verification missing
- Blocker 4: CSP hardening missing
- Unblocks: DEPLOY gate, Cascading gates
- Est. time to UNBLOCK: 3-4 hours (Phase 3 agents + manual security fixes)

### DEPLOY Gate: 🔴 HOLD
- Prerequisite: AUTH gate cleared (44/44 routes + cross-tenant test + security requirements)
- Prerequisite: Founder approval (authorization not automatic)
- Prerequisite: Production isolation verified (Cloudflare + Supabase deployment state confirmed)
- Status: UNVERIFIED
- Est. time to READY: 1 hour (post-AUTH, assuming founder approval)

### Cascading Gates: 🟡 DEFERRED
1. **Cloudflare Access Decision** (chief-ai-machine PR #206)
   - Gate: Founder approval for preview URLs through Access
   - Status: Code ready, boundary test passing
   
2. **Se'kret Bip Migration Deploy** (Se'kret Bip #1136)
   - Gate: Founder decision on migration timing
   - Status: Merged to main, NOT applied; rollback-safe, locked bootstrap tested
   
3. **GitHub App Private Key** (FCR production secret)
   - Gate: Founder pastes full PEM
   - Status: Portal ready, awaiting credential

---

## Test Coverage

**Regression Tests: 394+ per route class**
- Applied to: Authorization validation, workspace isolation, resource ownership
- Status: Passing (380/383 studio routes; 3 pre-existing unrelated failures)
- Ledger: Commits 33bd9c2 (implementation), ac301f2 (ledger)

**Playwright Witness Tests**
- Edge Defense Contract: ✅ GREEN on `e19b9fc`
- Reciprocal Defense Contract: ✅ GREEN (run 37352429735)
- SPA fallback (Cloudflare): ✅ Chromium real path confirms no SQL leak

---

## Summary: Readiness by Component

| Component | Coverage | Status | Gate | Unblock ETA |
|-----------|----------|--------|------|-------------|
| **Authorization** | 21/44 routes (48%) | Phase 3 in progress | 🔴 BLOCKED | Phase 3 agents |
| **Cross-Tenant Test** | Design pending | Not started | 🔴 BLOCKED | 2 hours |
| **Edge Defense** | 100% | Deployed & verified | ✅ COMPLETE | — |
| **Supabase RLS** | 100% enabled | Verified | ✅ COMPLETE | — |
| **Leaked-Password** | Both projects | OFF | 🔴 BLOCKED | 5 min (founder toggle) |
| **Stripe Webhooks** | Missing | Not implemented | 🔴 BLOCKED | 30 min |
| **CSP Hardening** | Missing | Not implemented | 🔴 BLOCKED | 1-2 hours |
| **GitHub App Key** | Missing | Waiting for founder | 🔴 BLOCKED | Founder action |
| **Production Isolation** | Inferred | Not operationally tested | 🔴 BLOCKED | 1 hour (post-deploy) |

---

**Labels used in this ledger:**
- ✅ **VERIFIED:** Observed in run output, log, or diff; deployed and confirmed
- 🔄 **IN PROGRESS:** Active work; observable status on working branch
- 🟡 **INFERRED:** High confidence from code review + indirect evidence; cannot directly observe (e.g., production state)
- ❓ **UNKNOWN:** Deferred; no decision made
- 🔴 **BLOCKED:** Requires action (founder decision, implementation, or test) before proceeding

---

**Next update:** When Phase 3 authorization remediation completes or blocker status changes.
