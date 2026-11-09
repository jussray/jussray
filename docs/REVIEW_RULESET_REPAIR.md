# Native review ruleset repair — admin-only, manual

Standing order: audit live main and exact PR head; systematically review and repair; pass exact-head unit, CI and browser checks; obtain one independent human GitHub PR approval on that head; only then allow separately founder-authorized merge/deployment.

This is a guarded reconciliation tool, not authority to merge or deploy. It only handles the existing repository ruleset in `jussray/jussray`. It does not grant permissions or install a GitHub token.

## Preconditions

- Have GitHub repository Administration (write) permission, and a scoped credential held outside source control.
- Independently review the current ruleset's all-branch `~ALL` scope and bypass actors. Changing the global ruleset affects branches beyond `main`, including `Production`.
- **APPROVED SAFE-SCOPE PLAN:** Live ruleset `26428639` has a `creation` rule covering `~ALL`. The guarded repair now narrows the target to the existing explicitly named protected refs (`main`, `Production`, `releases`, `Deployed`) before removing bypass actors. Normal development/feature branches no longer match this ruleset. The creation/deletion restrictions remain on those protected names. Initial creation of a reserved protected branch after bypass removal requires a separately approved administrative process. Unexpected ref patterns or exclusions block the repair.
- Review required deployment environments separately. This repair deliberately preserves all of them, including preview environments that may prevent merges.
- Keep exactly one native GitHub human approval. Founder `/approve` comments and auto-merge are NOT independent PR reviews and must never reduce the native requirement to zero.
- Use a trusted checkout. Do not execute the write from `pull_request` or untrusted CI.

## Read-only plan

Set `JUSS_GITHUB_RULESET_ADMIN_TOKEN` privately in the trusted environment and `JUSS_RULESET_ID` to the verified live ruleset ID. Then run:

```sh
node scripts/prepare-native-review-ruleset.mjs
```

Record the printed snapshot digest, required-check list, warnings, and corresponding GitHub ruleset identity. The read-only plan does not change GitHub.

## Deliberate apply (separate founder approval)

Only after reviewing *that exact current snapshot*, confirming the narrowed branch names and separate protected-branch creation process, and explicitly authorizing the all-branch impact, scope narrowing and bypass removal, provide the approved digest as `JUSS_APPROVED_RULESET_DIGEST` and run:

```sh
node scripts/prepare-native-review-ruleset.mjs --apply --approve-all-branches --approve-branch-scope --approve-bypass-removal
```

The script rejects missing admin credentials, stale snapshots, wrong repository identity, unexpected rules, and absent explicit approvals. It narrows the all-branch scope to the approved protected branch names while keeping strict checking, merge-review rules, creation/deletion restrictions on those branches, signatures, code scanning, linear history, and deployment environments. It adds missing non-fast-forward protection and the four systematic check contexts, removes existing bypass actors only with approval, and rereads GitHub to verify the update. **No GitHub API write or CI status is a merge/deploy approval.**

A GitHub API denial or a failed readback is **BLOCKED**, not verified. If the ruleset changes between plan and apply, obtain a new snapshot instead of forcing it.

## Live two-ruleset reconciliation finding (2026-11-09)

- Governance ruleset `26857902`: active on `main`, one required approval, bypass list empty; required-check list omits `Review Gate Unit Tests`, and strict checking is disabled. Native administrator update and readback remain pending.
- Production ruleset `26428639`: active on `~ALL` and protected refs, has a creation restriction and four bypass actors, empty required status checks and missing non-fast-forward protection. Safe scope repair must preserve one human approval.
- Retain original deployment, signature, scanning, code-quality and deletion protections. No administrative write is authorized without current snapshot verification and post-write readback.
