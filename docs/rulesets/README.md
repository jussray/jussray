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

## Proposed two-layer founder/FCR authority (2026-11-25)

Founder-selected native auto-merge remains the human authorization for the exact head; no separate native reviewer is required. Main contract remains the independent security floor with zero bypass actors and strict GitHub Actions checks. A separate Main Authority Contract may contain only the squash-only PR rule, with two PR-only actors: the founder User ID and the verified FCR GitHub App ID. The duplicate PR requirement in the security layer remains binding, including thread resolution. This gives no permission to skip mandatory checks, push directly, force-push, delete, merge without authorization, or deploy. The separate authority layer is intentionally not an importable artifact until the FCR App identity is verified and pinned in trusted main. The checker defaults to no delegated authority. Do not infer the FCR identity from integration 4047066. Do not install the proposed authority layer before trusted-main checker integration; current main rejects bypass actors. No live ruleset mutation is supplied by this patch. Preserve the Production ruleset outside main; activate and verify the security floor before reconciling overlapping Production rules. Existing FCR in-app founder-final receipt requirements remain separate.
