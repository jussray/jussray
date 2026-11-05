# skills/juss-authored

Draft export of Juss-authored skills, prepared 2026-11-03. Files are copied unmodified. `SHA256SUMS.txt` lists every file.

## Sources

- 11 skills from the account-synced copies: godmode-devil-ultrathink, godmode, goalfix, truth-decay, sauce-guard, futureyou-me-v10, juss-command-codex, runtime-kernel, founder-action-implant-verify, patch-implant-verify, l99-v21-transactional-authority.
- juss-os: canonical tree from jussray/ULTRATHINK- main @894bea7 (v3.1.1). The account copy (v3-DRAFT) is not used.
- confess, truthmode, reasoning-stack, juss-af-skills-pack: from jussray/ULTRATHINK- main @894bea7.
- `fcr-set/`: founder-control-room `skills/` (12 dirs) and `.ai/skills/` (9 dirs) at main @c61ea2c, included at the founder's request. Their content is not reviewed for third-party material.

## Known differences, not reconciled

- godmode-devil-ultrathink and juss-command-codex: jussray/ULTRATHINK- main holds different bytes from the account copies used here.
- goalfix: the account copy is 3115 bytes. founder-control-room holds a different variant at `.ai/skills/goalfix`.

## Not included

- founder-control-room's `.agents/skills/` (vendor-sourced Cloudflare skills are included there). Only `skills/` and `.ai/skills/` were copied, into `fcr-set/`.
- Memory-only frameworks (mode/lens stack, ACTUAL-FLOW V4, receipt.mjs). Their source was not located.

## Status

Nothing here is executed or tested. The juss-os scripts are Python and have not been run on this branch. No CI gate covers this path.
