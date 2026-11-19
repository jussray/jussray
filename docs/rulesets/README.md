# Rulesets for jussray/jussray

`main-contract.json` is the one ruleset that `CLAUDE.md`'s "Native ruleset" contract describes. `scripts/verify-independent-review.test.mjs` checks that this file passes the review gate's own ruleset check. It sets:

- target: the default branch (`main`) only, so feature branches such as `claude/*` stay pushable;
- no bypass actors;
- 0 native approvals: the founder review is enforced by the required **Independent Review Evidence** check, which reads a `/approve <sha>` comment made in the GitHub UI;
- four strict required checks: Independent Review Evidence, Review Gate Unit Tests, Juss & Co Site Browser Proof, Repo Reality / exact-head;
- review threads resolved before merge;
- force pushes and deletion of `main` blocked.

## Apply it (Juss, desktop browser, about 2 minutes)

1. Open https://github.com/jussray/jussray/settings/rules
2. Click **New ruleset** → **Import a ruleset**, then choose `docs/rulesets/main-contract.json`. Download the file from GitHub first: open it and click **Download raw file**.
3. Check that the target is the default branch and there are no bypass actors. Click **Create**.
4. Open **Governance**, set **Enforcement status** to **Disabled**, and save. Do the same in **Production**. Disabling keeps them for rollback; nothing is deleted.

Rollback: set Governance and Production back to **Active**, and disable "Main contract".

Why the old two do not work (observed 2026-11-13 to 2026-11-15):

- "Production" targets `~ALL`.
- Both require 1 approval, which the PR author cannot give.
- Between them they require deployments that never run: `github-pages`, `Think Tank / production`, `StoryEngine / production` and 13 historical PR environments.
- "Governance" requires 4 checks that never run on PRs here.
- "Production" requires signed commits.
- Both list integration `4047066` as an `always` bypass actor.
