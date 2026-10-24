# worlds-patch-executor

Portfolio patch readiness evaluator. Answers: which patches can merge now? What breaks downstream? How does cross-world governance affect each fix?

Pure Python stdlib. No network. Never merges, deploys, or runs tests. It reads what you declare and reports readiness.

## Usage

```bash
python worlds_patch.py worlds.json patches.json                 # full report (markdown)
python worlds_patch.py worlds.json patches.json --json          # machine-readable
python worlds_patch.py worlds.json patches.json --ready         # READY patches only
python worlds_patch.py worlds.json patches.json --depends-on L99   # worlds depending on L99
python worlds_patch.py worlds.json patches.json --impact core-auth # what core-auth reaches
python worlds_patch.py worlds.json patches.json --scan-docs     # find governance docs in local_path repos
```

## Input

**`worlds.json`:** Portfolio structure (world IDs, dependencies, governance rules, check state)

```json
{
  "worlds": [
    {
      "id": "core-auth",
      "repo": "github.com/...",
      "branch": "main",
      "depends_on": [],
      "governance": {
        "owner": "founder",
        "frozen": false,
        "required_checks": ["typecheck", "e2e"],
        "requires_approval_from": ["founder"],
        "protected_paths": ["src/crypto/*"],
        "public_surface": ["src/api/*"]
      },
      "state": {
        "checks": {
          "typecheck": {"status": "pass", "evidence": "https://ci/run/123"},
          "e2e": {"status": "pass", "evidence": "https://ci/run/123/playwright"}
        }
      }
    }
  ]
}
```

**`patches.json`:** Patch queue (target world, commit, proof, approvals)

```json
{
  "patches": [
    {
      "id": "auth-p1",
      "world": "core-auth",
      "commit": "abc123",
      "branch": "fix/otp-recovery",
      "summary": "Add OTP recovery path",
      "files": ["src/routes/auth.ts"],
      "rollback": "git revert abc123",
      "checks": {
        "e2e": {"status": "pass", "evidence": "https://ci/run/456/playwright"}
      },
      "approvals": ["founder"]
    }
  ]
}
```

## Output

Per-patch readiness report:

```
## auth-p1 → core-auth — READY

- REALITY: commit abc123 on fix/otp-recovery in github.com/...; Owner: founder; Depends on: nothing
- FIX: Add OTP recovery path — files: src/routes/auth.ts
- PROOF: VERIFIED typecheck: https://ci/run/123; VERIFIED e2e: https://ci/run/456/playwright
- RISK: impact LOW
- ROLLBACK: git revert abc123
- NEXT GATE: Merge per policy 'founder-approval' (a human decides — this tool never merges).
```

## Truth Rules

- **Pass check without evidence** = UNVERIFIED → PENDING (not READY)
- **Failing check** = BLOCKED
- **Frozen world** = BLOCKED
- **Upstream world BLOCKED/PENDING** = downstream PENDING
- **Upstream world failing a required check** (its own baseline, even with no queued patch) = downstream PENDING
- **Protected path touched** → requires approval from protected_approvers
- **Public surface changed + downstream frozen** = RISK flag

## See Also

`examples/worlds.json` — Juss portfolio structure (Chief AI, FCR, L99, Bip, StoryEngine)

Built for portfolio coordination. AI-agnostic (works with Claude, ChatGPT, Muse, DeepSeek, Perplexity).
