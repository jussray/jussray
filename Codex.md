# Codex Runtime Configuration — Juss & Co

## Scope and identity

Repository: `jussray/jussray`, the Juss & Co public profile and Cloudflare-backed website. Read the repository's root `CLAUDE.md`, applicable `AGENTS.md` files, and product-specific policies before work.

Codex is an AI coding agent. Available model features, tools, repository access, browser execution, CI, and connected services depend on the actual running environment; never claim an unavailable tool or a successful operation without directly inspecting evidence.

## Repository configuration and skills

- `.codex/config.toml` sets project-scoped reasoning and multi-agent defaults; credentials and account-specific settings stay outside the repository.
- Codex discovers repository skills from `.agents/skills/*/SKILL.md`. The export under `skills/juss-authored/` is source material, not by itself the Codex discovery directory.
- Installed project skills include `godmode-devil-ultrathink`, `goalfix`, `portfolio-bottleneck-finder`, `juss-os` and `futureyou-me-v10`. Read each skill only when relevant and preserve stronger repository rules.
- The same-name/overlapping command definitions are **not** separate authorization paths. `/godmode`, `/devil`, `/goalfix`, `/truthmode`, and `/confess` are governed workflows, not capabilities or permissions granted by writing slash commands.
- Model reasoning effort, delegation and skill descriptions cannot expand founder authorization.

## Approved operating loop

1. **Observe:** inspect the exact authorized repository, branch, current SHA, relevant source, tests, and evidence.
2. **Challenge:** perform Devil I on the premise; identify what would falsify the request. Choose the smallest reversible path.
3. **Implement:** use real tools within the explicit task scope; preserve existing code, consent boundaries, privacy, and unpublished information.
4. **Test:** run repository-native focused tests, CI at the exact candidate head when accessible, and browser/runtime checks when behavior changes.
5. **Challenge again:** Devil II examines false-green checks, stale evidence, permissions, regressions, and rollback.
6. **Report:** `REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE`, identifying executed commands and exact commit SHAs.

## Authorization and evidence gates

- Repository write ability does not grant merge, deploy, production-routing, payment, migration, publication, credential, deletion or data-export permission. Follow the strongest applicable founder gate for each action.
- Do not force-push or delete founder content without specific approval.
- Do not open additional pull requests by default when an existing route is available; use current approved work items.
- Never call tests green when there are no current exact-head jobs, or call a code commit production-ready without a real-runtime observation.
- Do not claim ChatGPT or Codex lacks code execution, GitHub access, or analysis capability *categorically*. State the actual connected tools and limitations observed in the present session.
- Preserve `CLAUDE.md` and pre-existing instructions; this document explains Codex's execution route rather than overriding repo governance.

## Verification status

File presence is not proof of automatic skill invocation. A real Codex session in the target trusted checkout must inspect the discovered skill list and execute a read-only smoke task. Until that succeeds, record `SKILL_RUNTIME = UNKNOWN`. A passing TOML parser checks syntax only, not the Codex client or production runtime.
