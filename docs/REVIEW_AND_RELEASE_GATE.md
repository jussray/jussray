# Juss & Co systematic review and release governance

**PROPOSED; not enforced.** GitHub returned zero active rulesets on 2026-11-02. Committed code, green checkmarks, and AI or FCR reports are not branch protection.

## Founder-directed policy

- **Zero required GitHub human review approvals.** Systematic review is based on deterministic, independent, exact-head checks. An outside review may report an unresolved change request, but must not be treated as the only way to authorize a merge.
- **No red commits merge.** A check from a previous head, absent required check, unverified evidence, or an ignored failed check does not count as green.
- Changes to `main` go through protected PRs with checks; restrict bypass actors, deletion and non-fast-forward updates. No new PRs or drafts unless founder authorizes them.
- **Founder approval is separate from review.** Release-sensitive actions require independently authenticated founder authority, bound to PR number, base SHA, head SHA and exact action. A username, AI statement, GitHub description, or saved preference cannot authenticate an actor.
- Cloudflare is the canonical host. Public asset readback is not a complete production deployment SHA attestation or proof of protected user flows.
- Publication of real-person outcome stories stays locked until authenticated consent, revocation and readback are proven.

## GitHub administrator setup

Configure an active native **branch ruleset for `main`** with:

1. Require pull requests and resolved review conversations; set `required_approving_review_count: 0`.
2. Require exact current-base checks with strict policy: `Repo Reality / exact-head`, `Juss & Co Site Browser Proof`, `Review Gate Unit Tests` and `Independent Review Evidence`. Obtain these contexts from actual GitHub results; do not use an ambiguous generic `verify` check.
3. Block force pushes and branch deletion. Do not configure unrestricted bypass actors.
4. Ensure checks required for every PR have unfiltered PR triggers. The source-browser workflow must run on all PRs; path-filtered required checks can stay pending forever or miss relevant updates.
5. Read back the active ruleset, its ID, required contexts and bypass actors; prove that failed, stale or missing checks prohibit merging.

**Bootstrap constraint:** The new independent authority job deliberately fails closed until its trusted decision module exists on protected `main`. Do not require this unavailable context during initial protected installation. Under the standing no-red-commit policy, a red bootstrap check still blocks merging; resolve the dependency through a separately approved, audited bootstrap rather than faking or skipping the result. Once the trusted module is on protected `main`, add and verify its required check contexts.

The policy checker validates PR metadata, review objections, exact head and native ruleset configuration. It does **not** itself prove that check runs passed, release founder authorization or production deployment. Its return value explicitly sets `releaseAuthorized:false`.

## Evidence and rollback

For a release, record `repository`, `PR`, `base/head SHA`, `ruleset ID`, `required check run IDs/results`, `actor/authority receipt`, `UTC timestamp`, `build/deployment IDs`, `public file hashes`, `verified runtime user journeys`, `security findings`, and `rollback`. Unknown fields remain UNKNOWN/BLOCKED; never fabricate a pass.

To roll back, use a separately authorized, independently green change that restores a prior verified state. Do not weaken the branch ruleset or switch off a failing gate simply to produce a green badge.

Related: PR #29 governance; PR #45 source checks; PR #54 public source/provider reconciliation.
