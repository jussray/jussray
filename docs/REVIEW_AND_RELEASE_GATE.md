# Juss & Co merge & release enforcement contract

Status: **PROPOSED, NOT ENFORCED** until GitHub returns an active, targeting-main ruleset with the settings below. Source code, checkmarks, FCR receipts, ChatGPT text, and CI job labels cannot substitute for GitHub ruleset enforcement.

## The one non-negotiable gate

A change to `jussray/jussray/main` must not be mergeable solely because tests passed or an author approved their own work.

A repository administrator must configure **Settings → Rules → Rulesets → New branch ruleset** with:

- Enforcement: **Active**. Target: repository default branch `main`.
- Require a pull request before merging; require **at least one approving review from a separate authorized human**. Enable **dismiss stale approvals on new commits**, **last-push approval**, and **resolve all review conversations**.
- Require exact-head checks by selecting the **actual contexts GitHub lists** for `Review Gate Unit Tests`, `Independent Review Evidence`, and `Juss & Co Site Browser Proof`. The existing browser-proof job has a unique name; do not select any unrelated generic `verify` job. Do not invent status check contexts.
- Do not exempt admins, bots, GitHub Apps, or automation accounts from required pull requests and checks. Review and limit any break-glass bypass actor separately with an auditable incident process.
- Block force pushes and deletion. Set applicable workflow-file ownership restrictions and preserve artifact/access secrets.
- Inspect required deployments and source → production asset/Worker version linkage before declaring a production launch.

**Crucial bootstrap:** This repository currently has zero active rulesets and `main` is not protected. This new PR provides checks but cannot activate the real GitHub merge block. Do **not** mark this contract active until the ruleset is read back through GitHub after creation.

## Safe two-stage bootstrap

1. First enable native GitHub protection on `main` using the already-existing site/source check and **one qualified independent human review**, before accepting any merge. Keep bypass actors restricted.
2. Review and merge this checker PR only through that native human-approval gate. The review authority job **must fail closed during bootstrap** because the trusted checker does not yet exist on `main`. Do not require the new checker context until after installation, and do not misrepresent this intentionally missing job as a successful control.
3. Once checker files exist on protected `main`, update the active ruleset to require the exact `Independent Review Evidence` context and `Juss & Co Site Browser Proof` alongside any agreed source checks. Verify the ruleset readback and negative blocked-merge examples.
4. Never load review-authority logic from PR head. The unit-test job may execute candidate code without write rights or secrets, but the review-evidence job must fetch `main` and fail closed if the trusted checker is absent.

**Note:** If the existing site proof is red because of a legitimate Cloudflare challenge, do not promote changes by temporarily disabling the check. Restore equivalent non-bypassing proof and retain the failing check until its replacement is validated. A release decision remains blocked.

## Reviewer evidence CI

`scripts/verify-independent-review.mjs` queries the GitHub PR and all review pages with a read-only `GITHUB_TOKEN` and fails closed for missing reviews, bots, author self-approval, wrong target, wrong head, stale approvals, unresolved change requests, incomplete pagination, and API errors. The workflow runs on PR updates and review events. Its authority job executes from trusted `main`, not unreviewed PR source; initial installation intentionally fails until bootstrapped.

**Threat model:** A PR can edit its own scripts and workflows. This read-only checker is an *additional signal*, not a tamper-proof GitHub authority. Only native rulesets plus independent authorized review prevent the PR author from removing/bypassing the check or force-merging.

## Distinct release gates

1. **Source readiness**: exact PR head, independently reviewed, unit/browser contracts pass.
2. **Build and deployment**: confirm production deployment ID + Worker version + source SHA; public asset hashes alone are partial.
3. **Public runtime**: validate hosted domains, HTTP origin status, redirects, responsive geometry, real user journeys, and safety/security boundaries.
4. **Release decision**: authorized signer reviews a durable receipt. A green test or a preview deployment is not authorization.

The Cloudflare Bot Fight Mode challenge currently causes `site-proof.yml` to fail under GitHub Chromium. It must **not** be muted, skipped, marked optional, or bypassed to get a green badge. Either restore equivalent independently witnessed proof or keep release blocked.

## Evidence receipt fields

`repository, branch, head_sha, pr_number, author, human_approver, approval_commit_sha, required_checks, review_threads, build_id, deployment_id, worker_version, public_asset_hashes, live_journeys, unresolved_findings, approved_by, status, checked_at`.

An absent field is **UNKNOWN/BLOCKED**, not VERIFIED. Never create a release receipt from an AI agent's own assertion of success.

## Acceptance demonstration

Use a throwaway branch and harmless isolated test PRs. Demonstrate that (1) no reviewer, (2) author-only review, (3) app/bot review, (4) approval then new commit, (5) requested changes, (6) failed source check, and (7) unverified production all prevent the appropriate approval or release. Capture GitHub API proof of actual blocked merges. Do not probe production auth or disable cyber protection as a test.

**Operational owner action required:** Nominate a distinct trusted human collaborator with review permissions. If no independent reviewer is available, leave merge blocked; do not certify your own changes as independent review.

Refs: Issue #25, PR #26 (merged with post-merge findings), PR #28 (corrective proof changes).
