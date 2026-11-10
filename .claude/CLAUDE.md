# Codex Runtime Configuration — Juss & Co

Founder-studio configuration for Claude Code. Sets operating stack, skill discovery, and authority routing.

## Runtime Identity

**Project**: jussray/jussray — Juss & Co public profile and founder studio runtime
**Skills Path**: `skills/juss-authored/` (16 core skills + FCR collection)
**Authority**: Founder-gated (/godmode routing per CLAUDE.md at root)

## Operating Stack

When working in this project, **coordinate through founder**:

1. **/godmode-devil-ultrathink** — Founder OS (redteam + OODA + L99) — founder-gated, Claude Code observes
2. **/goalfix** (for jussray-owned repos) — smallest reversible fix, verify on exact head — founder approves before merge
3. **/truthmode** + **/confess** — exact-head proof gates, no unverified claims — Claude Code reports, founder decides
4. **/juss-command-codex** — Codex-specific commands and shortcuts — requires founder invocation

## Skill Discovery

Codex discovers skills from `skills/juss-authored/*/SKILL.md`. Each skill declares:
- `description`: one-line capability statement (every skill)
- `triggers`: the slash commands it owns (e.g., `/goalfix`, `/confess`), only when it owns one. Each command has exactly one owner; see "Trigger ownership" in `skills/juss-authored/README.md`
- Prerequisites such as repo scope or founder approval are stated in the skill body; there is no `requirements` field

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

