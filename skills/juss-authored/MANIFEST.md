# Codex Skill Manifest — jussray/jussray

**Last Updated**: 2026-11-17  
**Total Skills**: 36  
**Configuration**: `.claude/settings.json` → `skills/juss-authored/`

---

## Core Founder Operating Stack (11 skills)

Account-synced; primary Juss & Co runtime skills.

| Skill | Triggers | Status |
|-------|----------|--------|
| **goalfix** | `/goalfix`, `/fixfast`, `/repair-verify-merge` | ✓ Verified |
| **godmode** | `/godmode` | Active |
| **godmode-devil-ultrathink** | `/godmode-devil-ultrathink`, `/attack`, `/redteam` | Active |
| **juss-command-codex** | `/codex` | Active |
| **juss-os** | `/juss-os` | Active |
| **truth-decay** | `/truth-decay` | Active |
| **sauce-guard** | `/sauce-guard` | Active |
| **futureyou-me-v10** | `/futureyou` | Active |
| **runtime-kernel** | `/runtime-kernel` | Active |
| **founder-action-implant-verify** | `/founder-action` | Active |
| **patch-implant-verify** | `/patch-implant-verify` | Active |
| **l99-v21-transactional-authority** | `/l99` | Active |

---

## Evidence & Authority Stack (4 skills)

Runtime truth, proof, and verification layer.

| Skill | Triggers | Status |
|-------|----------|--------|
| **truthmode** | `/truthmode` | ✓ Verified |
| **confess** | `/confess` | ✓ Verified |
| **reasoning-stack** | `/reasoning-stack` | Active |
| **juss-af-skills-pack** | `/juss-af` | Active |

---

## Founder Control Room Skills (21 skills)

Synced from `founder-control-room` repository. Includes product design, sales, outcome-first workflows, TypeScript audits, and portfolio control.

### From `fcr/skills/` (12 skills)

- outcome-first / ACCEPTANCE-TESTS
- fact-check-every-claim
- devil
- sales
- product-design-gate
- ultrathink-devil
- typescript-strict-review
- typescript-root-cause-debugger
- portfolio-control-plane
- typescript-audit
- typescript-behavior-tests
- typescript-minimal-patch

### From `fcr/.ai/skills/` (9 skills)

- truth-decay-audit
- claude-zapier-founder-operator
- juss-flow-launch-loop
- goalfix (alternate variant)
- ultrathink-devil (alternate variant)
- juss-founder-os
- chatgpt-openai-developers-zapier-bridge
- fact-check-every-claim (duplicate)
- unified-growth-inbox

---

## Discovery & Invocation

**Load a skill:**
```bash
# Via Skill tool
Skill(skill: "anthropic-skills:goalfix")

# Via trigger in chat
/goalfix
/confess
/truthmode
```

**Verify discovery:**
- Settings path: `.claude/settings.json` → `"skills_path": "skills/juss-authored"`
- Each skill has frontmatter: `name`, `description`, `license`, `metadata`
- CI validation: `juss-authored-skills-conformance` workflow runs on changes to this directory

---

## Known State (Verified 2026-11-17)

- ✓ Configuration valid
- ✓ Skill files present and properly structured
- ✓ Skill discovery working (tested: `/goalfix` loads from `anthropic-skills:goalfix`)
- ✓ Triggers and metadata present
- ⚠ Exact bytes differ on some skills between account copy and jussray/ULTRATHINK- main (see README.md)
- ⚠ Some fcr-set content not reviewed for third-party material (see README.md)

---

## Rollback & Maintenance

**To reset skill discovery:**
- Verify `.claude/settings.json` points to `skills/juss-authored/`
- Restart Claude Code session
- Re-run skill test: `/goalfix` or `/confess`

**To add a new skill:**
1. Create `skills/juss-authored/<skill-name>/SKILL.md` with frontmatter
2. Commit and push
3. CI validation runs automatically
4. Skill discoverable on next Codex session

**To verify all skills load:**
- Run: `node scripts/verify_inventory.py` (if available)
- Check: `git log --oneline -- skills/juss-authored/` for recent changes

---

## References

- Root CLAUDE.md: Founder operating contract & truth rules
- .claude/CLAUDE.md: Codex runtime configuration
- README.md: Source provenance & known differences
- SHA256SUMS.txt: File integrity tracking
