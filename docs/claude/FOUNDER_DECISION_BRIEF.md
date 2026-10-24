# Founder Decision Brief — Release Readiness

**Date:** 2026-10-11  
**For:** Juss  
**Status:** Four gates identified; three require founder decision; one in progress  
**Decisions needed:** Today (non-blocking Phase 3); within 3-4 hours (blocking DEPLOY)  
**Evidence:** docs/AUTHORIZATION_EVIDENCE_LEDGER.md (comprehensive) | docs/claude/STATE.md (timeline)

---

## What's Complete & Verified

✅ **Authorization Phase 1-2 (21/44 routes):** Studio routes hardened, high/medium-risk routes closed. Tests passing (380/383).

✅ **Edge Defense:** Production Cloudflare `chief-ai` Worker confirmed with rate limiting + attack detection. Live deployment verified.

✅ **Database Security:** Supabase RLS enabled on all 86 public tables (Se'kret Bip + FCR). Auth checks in place.

✅ **Governance:** Evidence distinction established (VERIFIED vs INFERRED). Rollback procedures documented. Authority boundaries clear.

---

## What's Blocked & Why

### 1. Authorization Phase 3 (23 routes remaining)
**Status:** IN PROGRESS (agents working)  
**Blocker:** Cross-tenant isolation test suite not started  
**Impact:** Can't release until all 44 routes + denial tests verified  
**Decision:** Approve Phase 3 agents to complete? (Code review before merge still applies)  
**Est. time:** 2-3 hours (remediation + regression tests)  
**Risk of delay:** Release held; no new vulnerabilities if deferred properly

### 2. Stripe Webhook Verification (MISSING)
**Status:** NOT IMPLEMENTED  
**Blocker:** No HMAC-SHA256 signature validation on webhook payloads  
**Impact:** Payment replay risk if webhook endpoint exposed  
**Decision:** Implement before DEPLOY (can run in parallel with Phase 3)  
**Est. time:** ~30 min (implementation + tests)  
**Risk of delay:** Security gap in payment flow

### 3. CSP Hardening (MISSING)
**Status:** NOT IMPLEMENTED  
**Blocker:** Content-Security-Policy headers not on all responses  
**Impact:** Injection attack surface  
**Decision:** Implement before DEPLOY (can run in parallel with Phase 3)  
**Est. time:** ~1-2 hours (headers + testing)  
**Risk of delay:** Security gap in HTTP response headers

### 4. GitHub App Private Key (MISSING)
**Status:** WAITING FOR FOUNDER CREDENTIAL  
**Blocker:** APP_PRIVATE_KEY not in FCR `production` secret  
**Impact:** `portfolio-evidence-sync` workflow fails; worlds.json can't refresh evidence  
**Decision:** Paste full PEM into FCR → unblocks evidence refresh  
**Est. time:** ~5 min (copy/paste)  
**Risk of delay:** Evidence ledger stale; status won't auto-update

### 5. Leaked-Password Protection (OFF)
**Status:** TOGGLE AVAILABLE  
**Blocker:** Both Supabase projects have toggle OFF  
**Impact:** Subscriber reuse detection disabled  
**Decision:** Toggle ON (Supabase dashboard)  
**Est. time:** 1 click, 2 min  
**Risk of delay:** Compliance gap; subscriber accounts exposed to reuse risk

### 6. Cloudflare Access Decision (PR #206)
**Status:** CODE READY, boundary test passing  
**Blocker:** Awaiting founder approval  
**Impact:** Preview URLs for artifact leak fix can't be served through Access  
**Decision:** Approve preview URLs through Access? (YES/NO)  
**Est. time:** 1 decision; merge + deploy ~10 min  
**Risk of delay:** PR #206 stays unmerged; artifact leak fix not live

### 7. Se'kret Bip Migration (PR #1136)
**Status:** MERGED TO MAIN, not applied  
**Blocker:** Awaiting founder decision  
**Impact:** Anonymous-session migration not live; code merged but not deployed  
**Decision:** Deploy when ready? (Rollback-safe; locked bootstrap tested)  
**Est. time:** Dispatch workflow ~10 min  
**Risk of delay:** Migration deferred; feature not live

---

## Next Three Decisions (Priority Order)

### 1. **Approve Phase 3 Authorization** (enables DEPLOY gate)
**Question:** Should agents complete 23-route remediation + cross-tenant tests?  
**Autonomy note:** Code review before merge still applies; this approves agent work to proceed.  
**Answer needed:** YES → agents work | NO → DEPLOY gate stays blocked indefinitely  
**Timeline:** Must decide within 1 hour to keep Phase 3 pace  

### 2. **Provide GitHub App Private Key** (unblocks evidence refresh)
**Question:** Paste full PEM into FCR `production` secret `APP_PRIVATE_KEY`?  
**Action:** One copy/paste operation; backend does the rest  
**Answer needed:** Credential entry (or deferral if not ready)  
**Timeline:** Can do anytime; recommended before DEPLOY (verifies evidence-sync works)

### 3. **Decide Cloudflare Access for PR #206** (unblocks artifact leak fix)
**Question:** Approve preview URLs through Cloudflare Access?  
**Impact:** Enables secure preview deployment of supabase/ exclusion fix  
**Answer needed:** YES → merge #206 | NO/DEFER → keep artifact leak fix unmerged  
**Timeline:** Independent; can decide anytime

---

## Timeline to Release-Ready

**Now → 30 min:**
- Approve Phase 3 agents (decision)
- Toggle leaked-password ON (2 min action)
- Provide GitHub App key (5 min action)
- Decide Cloudflare Access (1 decision)

**30 min → 3 hours:**
- Phase 3 agents: Complete 23-route remediation + regression tests
- Manual security: Implement Stripe webhook verification (~30 min)
- Manual security: Implement CSP hardening (~1-2 hours)
- Cross-tenant test suite: Design + execute (~2 hours)

**3-4 hours → DEPLOY Ready:**
- AUTH gate clears (all 44 routes + cross-tenant test + security fixes live)
- Founder approval for DEPLOY (confirmation needed)
- Verification: Live traffic test, worlds.json freshness, evidence-sync ✓

**Post-DEPLOY:**
- Se'kret Bip migration (dispatch when ready)
- Monitor worlds.json evidence refresh (should auto-update via evidence-sync)

---

## Release Gates at a Glance

| Gate | Status | Unblock Condition | ETA |
|------|--------|------------------|-----|
| **AUTH** | 🔴 BLOCKED | 44/44 routes + cross-tenant test + security fixes | 3-4 hours |
| **DEPLOY** | 🔴 HOLD | AUTH cleared + founder approval + prod verification | +1 hour post-AUTH |
| **Cascades** | 🟡 DEFERRED | Founder decisions (Access, Migration key, GitHub key, toggle) | Independent |

---

## What Happens If We Don't Release

**If AUTH gate stays blocked:** No production release; evidence ledger stale; worlds.json can't auto-update.

**If DEPLOY gate deferred:** Authorization fixes stay in code; production stays at prior vulnerability state; no evidence-sync; no GitHub integration for Founder Control Room.

**If founder secrets not provided:** Evidence-sync fails; status pages show stale data; GitHub App can't authenticate; preview URLs can't use Access.

---

## Confidence Level

- **Authorization fixes:** VERIFIED (code reviewed, tests passing, commits live)
- **Security findings:** VERIFIED (edge defense deployed) + INFERRED (production state, cannot observe directly) + BLOCKED (missing implementations)
- **Cross-tenant test:** NOT YET ATTEMPTED (design + execution required)
- **Timeline estimates:** Based on prior session pacing; +30% buffer recommended for unknowns

---

## Actions for Juss

**Immediate (next message):**
1. Approve Phase 3 agents: YES / NO / DEFER?
2. Cloudflare Access decision: YES / NO / DEFER?

**Next 30 min (while Phase 3 runs):**
3. Paste GitHub App private key (full PEM) → FCR `production` secret
4. Toggle leaked-password ON (Supabase dashboard, both projects)

**Parallel (optional if urgent):**
5. Can start Stripe webhook + CSP implementations now, or wait for Phase 3 to finish

**Post-DEPLOY (when ready):**
6. Se'kret Bip migration: Dispatch when ready

---

**Questions?** Reference docs/AUTHORIZATION_EVIDENCE_LEDGER.md for detailed evidence, or docs/claude/STATE.md for timeline context.
