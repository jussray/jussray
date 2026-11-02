# AI Evaluation Portfolio Packet — Juss Rayy

This packet is designed for AI-evaluation, product-review, product-design, and human-judgment opportunities that ask applicants to demonstrate how they assess quality, correctness, safety, evidence, and product intent.

> **Eligibility boundary:** This is portfolio material, not a claim of eligibility for any specific platform or project. Confirm the opportunity's current age, identity, education, location, and work-authorization requirements before applying. Never misstate age, education, employment history, or credentials.

## Reviewer summary

I work at the intersection of product judgment, AI-assisted implementation, verification, and founder-controlled systems. My strongest evaluation skill is separating a plausible output from a supported output.

Across the projects below I repeatedly:

- turn ambiguous goals into explicit acceptance criteria;
- compare implementation or model outputs against product intent;
- identify unsupported claims, stale evidence, hidden assumptions, privacy leaks, and false-green tests;
- distinguish source existence from runtime behavior and current production truth;
- write structured feedback that another human or model can act on;
- keep consequential decisions bounded by authority, evidence, and rollback;
- preserve historical proof without mislabeling it as current truth.

The three projects below show different forms of judgment: privacy/product judgment, AI-system/evidence judgment, and real-time game/runtime judgment.

---

# Packet 1 — Se’kret Bip

**Domain:** Product design · App design · Privacy/safety judgment · Full-stack systems

**Authoritative repository:** https://github.com/jussray/Sekret-Bip  
**Current repository head observed for this packet:** `5a507543152c1c84d1798330f2442c8c1d98f1dc`

## Problem I was solving

Create a teen/family product that supports reflection, self-expression, emotional growth, and healthier family communication without turning family connection into surveillance.

## Judgment I applied

The key design decision was to treat privacy and consent as product behavior, not decorative policy text.

Examples:

- teen-created content is private by default;
- linking a parent does not grant blanket access;
- sharing must be explicit and scoped;
- UI visibility is not authorization;
- database and server-side checks remain authoritative;
- unlinking and revocation must affect future access;
- safety handling must not become a general private-content browser.

## Evidence

### Canonical consent/visibility contract

Exact-source link:

https://github.com/jussray/Sekret-Bip/blob/5a507543152c1c84d1798330f2442c8c1d98f1dc/docs/PARENT_WINDOW_CONSENT_CONTRACT.md

The contract defines who may read, write, share, revoke, summarize, cache, and retain content. It explicitly states that a parent link does not grant blanket access and that UI visibility alone is not authorization.

### Truth and evidence contract

Exact-source link:

https://github.com/jussray/Sekret-Bip/blob/5a507543152c1c84d1798330f2442c8c1d98f1dc/docs/TRUTH_AUTHORITY.md

This contract separates repository truth, provider truth, database truth, browser proof, physical-device proof, and controlled-account proof. It also defines VERIFIED, HISTORICAL, SUPERSEDED/REVOKED, and UNKNOWN states.

## What this demonstrates to an evaluator

- I can spot when a product claim is supported only by UI rather than real authorization.
- I can reason about scope, consent, revocation, and data minimization.
- I can reject an attractive but unsafe shortcut.
- I can distinguish "code exists" from "behavior is verified."
- I can write evaluation rules precise enough for humans, tests, and AI agents to use consistently.

## Safe attachment set

Good to share:

- public README excerpts;
- the public consent/visibility contract;
- the public truth-authority contract;
- founder-owned product screenshots that contain no real user data;
- public browser-test or implementation-ledger excerpts with no secrets.

Do not share:

- teen/family data;
- private messages, journals, voice transcripts, or safety content;
- credentials or environment secrets;
- private prompts or unreleased safety thresholds;
- broad database exports.

---

# Packet 2 — Founder Control Room

**Domain:** AI evaluation · Product systems · Enterprise/workflow design · Governance and verification

**Authoritative repository:** https://github.com/jussray/founder-control-room  
**Current repository head observed for this packet:** `cbcce64643c95a5abd761cdf5aa04ff65dadf7b0`

## Problem I was solving

Build a founder operating environment that can use AI, repositories, providers, and automation without confusing:

`plan → action → receipt → evidence → verified outcome`

A model response, API acknowledgement, deployment, or green test should never automatically become "truth."

## Judgment I applied

The core evaluation rule is that evidence must match the exact claim.

Examples:

- a screenshot can prove appearance but not database authorization;
- a provider upload can prove an upload but not a successful user outcome;
- a green source test does not automatically prove production behavior;
- a stale exact-head proof cannot authorize a moved candidate;
- a model or tool can recommend an action without gaining authority to execute it;
- unknown data should render as unknown, rather than being silently converted to a reassuring number.

## Evidence

### Real-browser dashboard proof

Exact-source link:

https://github.com/jussray/founder-control-room/blob/cbcce64643c95a5abd761cdf5aa04ff65dadf7b0/e2e/founder-home-dashboard-proof.mjs

This Playwright proof explicitly documents both what it proves and what it does not prove. It verifies browser rendering from served fixture data, UNKNOWN / Not connected behavior, deep-link behavior, responsive overflow, and signed-out state while refusing to claim real Express, Supabase, GitHub, or production proof.

### Governed approval boundary

Current implementation source:

https://github.com/jussray/founder-control-room/blob/cbcce64643c95a5abd761cdf5aa04ff65dadf7b0/src/http/routes/approvals.ts

The approval path validates bounded review/approval metadata and rejects invalid or caller-expanded policy inputs. The broader repository contract keeps execution authority, review, evidence, and founder-final approval as separate concepts.

## What this demonstrates to an evaluator

- I evaluate whether evidence is relevant to the exact claim, not merely impressive-looking.
- I can identify false-green behavior and scope mismatch.
- I can preserve dissent, unknowns, and failure signals instead of smoothing them away.
- I can reason about authorization separately from model quality.
- I can design tests that include negative claims: what the test does **not** prove.
- I can review AI-generated or agent-generated work for unsupported certainty.

## Mini evaluation rubric I use

When comparing two AI/product outputs, I ask:

1. **Goal fidelity** — Does the output solve the actual request?
2. **Evidence** — Which claims are observed, inferred, unknown, or blocked?
3. **Scope** — Does the evidence prove this exact claim?
4. **Freshness** — Is the proof still bound to the current source/runtime?
5. **Safety/privacy** — Does the output weaken a real boundary to look successful?
6. **Authority** — Is it recommending, drafting, or actually authorized to act?
7. **Failure honesty** — Are errors and unknowns preserved?
8. **Reversibility** — Can the proposed change be rolled back cleanly?
9. **Communication quality** — Can another reviewer reproduce the reasoning?

## Safe attachment set

Good to share:

- public README truth model;
- public governance/verification docs;
- the Playwright proof source above;
- founder-owned public dashboard screenshots with no sensitive workspace data;
- public code excerpts that demonstrate bounded validation.

Do not share:

- credentials, secrets, tokens, private customer/workspace data;
- proprietary prompts or private model instructions;
- private provider receipts containing sensitive identifiers;
- unreleased internal thresholds.

---

# Packet 3 — SYNC Party

**Domain:** Game development · Real-time product design · Multiplayer systems · Browser verification

**Authoritative repository:** https://github.com/jussray/sync-party-game  
**Current repository head observed for this packet:** `c8e8e3cef32f108a0ed18d1d567e718877d1b449`

## Problem I was solving

Create a low-friction multiplayer party-game loop:

`create → join → choose → reveal → score → replay`

Players should be able to join without rebuilding the room, choices should stay hidden before reveal, reconnect should preserve identity/state, and multiple clients should observe one authoritative room state.

## Judgment I applied

The important decision was not to treat "the page loads" as multiplayer proof.

The release evidence needed to demonstrate:

- room-code create/join;
- independent browser contexts;
- synchronized authoritative state;
- hidden choice before reveal;
- scoring and reveal behavior;
- refresh/drop reconnect;
- multiple rounds;
- same-room rematch;
- phone and laptop paths.

## Evidence

### Proof ledger

Current repository link:

https://github.com/jussray/sync-party-game/blob/c8e8e3cef32f108a0ed18d1d567e718877d1b449/docs/PROOF-LEDGER.md

The ledger preserves distinct VERIFIED, UNKNOWN, and BLOCKED gates rather than collapsing the project into one green/red state.

### Historical public production browser receipt

Current repository link to preserved receipt:

https://github.com/jussray/sync-party-game/blob/c8e8e3cef32f108a0ed18d1d567e718877d1b449/docs/receipts/2026-09-25-handshake-public-production-proof.md

Evidence subject:

`ddafeae4b66c9c83b83d9ca1b4825836808b3d9c`

Recorded proof included exact deployed-SHA validation followed by public-production Playwright: 4 tests in 30.6 seconds, phone + laptop contexts, hidden-choice privacy, reconnect, five rounds, results, same-room rematch, and the Durable Object timeout path.

**Important boundary:** this is preserved historical production proof for that exact source/runtime subject. It is not automatically a claim that the current moving runtime is unchanged.

## What this demonstrates to an evaluator

- I can convert a fuzzy requirement like "multiplayer works" into observable gates.
- I can separate client appearance from authoritative shared state.
- I can test privacy behavior inside a game mechanic.
- I can preserve old proof as historical rather than deleting it when the codebase moves.
- I can keep one failed or unknown lane separate from unrelated passing lanes.

## Safe attachment set

Good to share:

- public gameplay screenshots;
- public proof-ledger excerpts;
- the historical production proof receipt;
- public Playwright traces/screenshots when they contain no secrets;
- product-flow diagrams.

Do not share:

- secrets/provider credentials;
- private deployment configuration;
- tokens or private identifiers embedded in traces;
- claims that historical proof automatically represents the current runtime.

---

# Best three-work sample order

For an AI-evaluation reviewer, present these in this order:

1. **Founder Control Room** — strongest direct evidence of evaluation methodology, evidence discipline, false-green resistance, and scoped reasoning.
2. **Se’kret Bip** — strongest evidence of product judgment under privacy, consent, family, and safety constraints.
3. **SYNC Party** — strongest evidence that the same evaluation discipline transfers to a real-time multiplayer product and browser/runtime proof.

For a product-design reviewer, use:

1. **Se’kret Bip**
2. **SYNC Party**
3. **Founder Control Room**

For a technical AI-systems reviewer, use:

1. **Founder Control Room**
2. **SYNC Party**
3. **Se’kret Bip**

---

# Short portfolio statement

I use AI as a builder and reviewer, but I do not treat model output as authority. My work focuses on turning ambiguous goals into testable product contracts, comparing outputs against evidence and intent, finding unsupported certainty and hidden failure modes, and preserving exact proof and rollback. The projects above show that judgment across AI operations, privacy-first family products, and real-time multiplayer systems.

# Final submission check

Before using any material externally:

- confirm the opportunity's eligibility requirements;
- use only work you own or are authorized to share;
- remove credentials, private data, private prompts, and sensitive identifiers;
- label historical proof as historical;
- do not claim a current runtime state without a fresh observation;
- do not inflate founder direction, AI-assisted implementation, or verification into credentials or employment history that do not exist.
