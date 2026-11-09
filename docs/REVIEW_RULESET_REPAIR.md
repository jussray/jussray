# Native review ruleset repair — admin-only, manual

Standing order: review live main and exact PR head; perform systematic code and security review; apply a focused reversible repair; verify exact-head tests, CI and browser evidence; obtain one independent human GitHub approval on that exact head; only then consider founder-authorized merge or deployment. Automated review is not an alternative to human GitHub approval.

This is a guarded reconciliation tool, not authority to merge or deploy. It only handles the existing repository ruleset in `jussray/jussray`. It does not grant permissions or install a GitHub token.

## Preconditions

- Have GitHub repository Administration (write) permission, and a scoped credential held outside source control.
- Independently review the current ruleset's all-branch `~ALL` scope and bypass actors. Changing the global ruleset affects branches beyond `main`, including `Production`.
- **APPROVED SAFE-SCOPE PLAN:** Live ruleset `26428639` has a `creation` rule covering `~ALL`. The guarded repair now narrows the target to the existing explicitly named protected refs (`main`, `Production`, `releases`, `Deployed`) before removing bypass actors. Normal development/feature branches no longer match this ruleset. The creation/deletion restrictions remain on those protected names. Initial creation of a reserved protected branch after bypass removal requires a separately approved administrative process. Unexpected ref patterns or exclusions block the repair.
- Review required deployment environments separately. This repair deliberately preserves all of them, including preview environments that may prevent merges.
- Preserve one independent human GitHub approval in the native ruleset. Never lower the approval count to zero.
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
