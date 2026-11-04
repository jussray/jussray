# skills/juss-authored

First-party export of Juss-authored skills, originally prepared 2026-11-03. The export has since received narrowly scoped security, schema, documentation, and regression-test repairs. `SHA256SUMS.txt` tracks the current bytes of every checked-in file under this directory other than the checksum manifest itself. It is not a source-of-truth signature.

## Sources

- 11 skills from the account-synced copies: godmode-devil-ultrathink, godmode, goalfix, truth-decay, sauce-guard, futureyou-me-v10, juss-command-codex, runtime-kernel, founder-action-implant-verify, patch-implant-verify, l99-v21-transactional-authority.
- juss-os: exported tree from jussray/ULTRATHINK- main @894bea7 (v3.1.1). Formal `FOUNDER ACCEPT` canonicalization remains UNKNOWN; the account copy (v3-DRAFT) was not used.
- confess, truthmode, reasoning-stack, juss-af-skills-pack: from jussray/ULTRATHINK- main @894bea7.
- `fcr-set/`: founder-control-room `skills/` (12 dirs) and `.ai/skills/` (9 dirs) at main @c61ea2c, included at the founder's request. Their content has not been reviewed for third-party material.

## Known differences, not reconciled

- godmode-devil-ultrathink and juss-command-codex: jussray/ULTRATHINK- main holds different bytes from the account copies used here.
- goalfix: the account copy was 3115 bytes; founder-control-room holds a different variant at `.ai/skills/goalfix`.
- These files have not been automatically installed into Chief AI, Founder Control Room, production Workers, or customer runtimes.

## Not included

- founder-control-room's `.agents/skills/` (vendor-sourced Cloudflare skills are included there). Only `skills/` and `.ai/skills/` were copied, into `fcr-set/`.
- Memory-only frameworks (mode/lens stack, ACTUAL-FLOW V4, receipt.mjs). Their authoritative source was not located.

## Verification scope

- The `juss-authored-skills-conformance` GitHub workflow compiles and executes local receipt tests and checks the manifest integrity against the tracked inventory when changes touch this directory.
- A passing checksum proves file-byte consistency against this committed manifest, **not provenance, authenticity, or the safety of the file**. A passing unit test does not prove external runtime behavior.
- Exact-commit workflow conclusions must be observed before any CI claim; no deployment, merge, or live integration is implied by this export.
