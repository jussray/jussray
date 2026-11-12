# Codex Runtime Configuration — Juss & Co

Founder-studio configuration for Claude Code. Sets operating stack, skill discovery, and authority routing.

**Platform-specific configs:** `Codex.md` (code generation, Claude Code), `ChatGPT.md` (reasoning partner), `Gemini.md` (analysis partner), `Muse.md` (design partner).

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
- `/medusa` — security assessment validation (gate/protect/snapshot/verify-ledger)
- `/confess` — declare real state and real risks
- `/truthmode` — enter proof-only mode (exact-head gates)
- `/juss-os` — access full command tree

See `skills/juss-authored/` for full SKILL.md definitions.

