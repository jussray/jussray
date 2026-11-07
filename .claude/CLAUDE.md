# Claude Code Runtime Configuration — Juss & Co

Founder-studio configuration for Claude Code. Sets operating stack, skill discovery, and authority routing.

## Runtime Identity

**Project**: jussray/jussray — Juss & Co public profile and founder studio runtime
**Curated source skills**: `skills/juss-authored/` (repo-authored export); Codex repository discovery uses `.agents/skills/`.
**Authority**: Founder-gated (/godmode routing per CLAUDE.md at root)

## Operating Stack

When working in this project, **load and apply**:

1. **/godmode-devil-ultrathink** — Founder OS (redteam + OODA + L99)
2. **/goalfix** (for jussray-owned repos) — smallest reversible fix, verify on exact head
3. **/truthmode** + **/confess** — exact-head proof gates, no unverified claims
4. **/juss-command-codex** — Codex-specific commands and shortcuts

## Skill Discovery

Claude Code uses its configured Claude skills and project instructions. Codex discovers repository skills from `.agents/skills/*/SKILL.md`, not from the curated export directory alone. Each skill declares:
- `trigger`: slash commands (e.g., `/goalfix`, `/confess`)
- `description`: one-line capability statement
- `requirements`: prerequisites (e.g., repo scope, founder approval)

## Standing Rules (from root CLAUDE.md)

- **Proof-led**: observe → audit → fix → test → document → commit → prove → merge
- **Smallest reversible change**: no refactors, no rewrites, one cause before many symptoms
- **Never re-explain**: Juss wrote it once; re-reading is Claude's job
- **Real state only**: VERIFIED / INFERRED / UNKNOWN / BLOCKED — never a guess
- **Merge only on proof**: no merge over blocked gate, no unverified claim

## Codex-Specific Shortcuts

- `/goalfix` — enter repair mode (auto-loads /godmode-devil-ultrathink)
- `/confess` — declare real state and real risks
- `/truthmode` — enter proof-only mode (exact-head gates)
- `/juss-os` — access full command tree

See `skills/juss-authored/` for full SKILL.md definitions.

