# Native review ruleset repair — admin-only, manual

This is a guarded reconciliation tool, not authority to merge or deploy. It only handles the existing repository ruleset in `jussray/jussray`. It does not grant permissions or install a GitHub token.

## Preconditions

- Have GitHub repository Administration (write) permission, and a scoped credential held outside source control.
- Independently review the current ruleset's all-branch `~ALL` scope and bypass actors. Changing the global ruleset affects branches beyond `main`, including `Production`.
- Review required deployment environments separately. This repair deliberately preserves all of them, including preview environments that may prevent merges.
- Use a trusted checkout. Do not execute the write from `pull_request` or untrusted CI.

## Read-only plan

Set `JUSS_GITHUB_RULESET_ADMIN_TOKEN` privately in the trusted environment and `JUSS_RULESET_ID` to the verified live ruleset ID. Then run:

```sh
node scripts/prepare-native-review-ruleset.mjs
```

Record the printed snapshot digest, required-check list, warnings, and corresponding GitHub ruleset identity. The read-only plan does not change GitHub.

## Deliberate apply (separate founder approval)

Only after reviewing *that exact current snapshot* and explicitly authorizing the all-branch impact and bypass removal, provide the approved digest as `JUSS_APPROVED_RULESET_DIGEST` and run:

```sh
node scripts/prepare-native-review-ruleset.mjs --apply --approve-all-branches --approve-bypass-removal
```

The script rejects missing admin credentials, stale snapshots, wrong repository identity, unexpected rules, and absent explicit approvals. It keeps existing branch scope, strict checking, merge-review rules, deletion protection, signatures, code scanning, linear history, and deployment environments. It adds missing non-fast-forward protection and the four systematic check contexts, removes existing bypass actors only with approval, and rereads GitHub to verify the update. **No GitHub API write or CI status is a merge/deploy approval.**

A GitHub API denial or a failed readback is **BLOCKED**, not verified. If the ruleset changes between plan and apply, obtain a new snapshot instead of forcing it.
