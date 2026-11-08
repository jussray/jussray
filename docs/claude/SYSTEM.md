# Juss's Claude system: setup guide (2026-11-08)

How Claude works for Juss across sessions, apps and scheduled runs. **Rules live in two places:** repo `CLAUDE.md` and `docs/claude/STATE.md` for code work, mirrored into one Claude Project per workstream for chat work. This file is public, so it holds no private data, tokens or addresses.

## 1. Executive summary

The three tasks that eat the week, confirmed by Juss on 2026-11-08:

| # | Task | What changes | Hours saved / week (estimate, not measured) |
|---|------|--------------|---------------------------------------------|
| 1 | Mockup → live site | One Project holds the mockups, proportions rule and voice; Claude builds, screenshots at 3 widths and lists every mismatch before calling it done | 3–5 |
| 2 | PR review → merge | Systematic review, focused repair, four exact-head checks, then one independent human GitHub approval; the daily digest shows blockers | 2–4 |
| 3 | "Is it actually live?" | A scheduled live-site readback (once the Browser Rendering token works) replaces manual checking | 1–2 |

These estimates are a target for Juss to correct against real weeks.

## 2. Model map

| Task | Model | Why |
|------|-------|-----|
| Mockup → site build, design matching | Opus 5.5 | Long visual reasoning, many files, proportions |
| Systematic PR review (before human approval) | Opus 5.5 | Has to catch real defects, not style nits |
| CI triage, PR babysitting, small fixes | Sonnet 5.5 | Fast and accurate on narrow, well-defined work |
| Daily digests (GitHub, inbox, calendar, Slack) | Haiku 5.5 | Summarising and sorting; cheap to run daily |
| Writing in Juss's voice (posts, replies) | Sonnet 5.5 | Good prose at speed; Opus only for launch copy |

## 3. Prompt rules pack (copy-paste)

```
Done only when: [one line Juss can check in 5 seconds, e.g. "screenshot at 390px matches the mockup's 3 tiles per view"].
Before building: ask the questions that would change the result, then wait.
Cite every fact: file + section, or URL. If a price, date, source or number is missing, write "Not found."
Never send, delete, spend, merge or deploy without Juss's explicit yes in this conversation.
```

## 4. Project blueprints (Claude.ai Projects, for chat work)

| Project | Purpose | Upload only | Instructions (paste) | Example output |
|---------|---------|-------------|----------------------|----------------|
| Juss & Co Site | Mockups → site decisions | Founder mockups; `CLAUDE.md`; `site/data/worlds.json` | "Match mockup proportions, not just parts. Status and links only from worlds.json. Done = screenshot list at 1440/1672/390 with every mismatch named." | A mismatch list with fixes |
| Release Desk | PRs, gates, rollbacks | `CLAUDE.md`; `docs/claude/STATE.md` | "Report REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE. Never claim live without a readback." | The merge note for a PR |
| Brand Voice | Posts, replies, launches | 5 pieces Juss wrote himself | "Keep Juss's rough edges: terse, direct, no hype words. Draft only." | One post in his voice |

**Voice guide (starter):** short sentences; says what is real and what is pending; no "revolutionary", "seamless" or "game-changing"; signs as Juss.

## 5. Skills list

The skills in `skills/juss-authored/` (godmode, goalfix, truthmode, confess, juss-os and the rest) stay as they are. New skill candidates follow the rule: any task explained 3+ times becomes a skill.

| Skill | Trigger | Output format |
|-------|---------|---------------|
| `mockup-match` | Juss sends a mockup image | Side-by-side checklist (part, size, position) plus screenshots at 3 widths |
| `release-receipt` | A PR merges | REALITY / FIX / PROOF / RISK / ROLLBACK / NEXT GATE appended to STATE.md |

## 6. Connector plan (drafts only, all four)

| App | Task | Drafts-only rule |
|-----|------|------------------|
| GitHub | Daily digest: open PRs, red checks, blocked gates | Read and comment drafts; no merge, no settings change without Juss's yes |
| Gmail | Inbox triage: label, summarise, draft replies | "Don't send anything." Drafts only; never delete |
| Notion | Mirror of this guide plus handover notes | Writes only to a private "Claude handover" page |
| Slack | Status-update drafts for Juss's channels | Draft in a DM to Juss; never post to a channel |

**Memory hygiene:** stale details to fix are listed in `docs/claude/STATE.md` under "Still open". Remove any entry once it's resolved.

## 7. Automation schedule (proposed: not created until Juss approves each one)

| Time (Juss's local) | Prompt | Quiet rule | Log |
|---------------------|--------|------------|-----|
| Weekdays ~8:40 | GitHub digest for jussray/jussray: open PRs, red checks, gate reasons, links | If nothing changed: "Checked. No changes." | Dated line in STATE.md |
| Weekdays ~9:10 | Gmail triage: summarise new mail, draft replies, never send | "Checked. No changes." | Handover note under 200 words |
| Daily ~18:20 | Live-site readback (needs a working Browser Rendering token) | Silent unless something changed | Dated line in STATE.md |

Handover note format, under 200 words: **finished**, **decided why**, **open**, **next step**.

## 8. CLAUDE.md rulebook (start with 3; add one at a time)

```
1. Done = a check Juss can do in 5 seconds; state it before building.
2. Never send, delete, spend, merge or deploy without Juss's explicit yes.
3. Missing price, date, source or number → "Not found." Never invent one.
```

Rules already in `CLAUDE.md` (truth rules, proof-led workflow, standing rules) stay. These three are the core set the rollout adds first.

## 9. Seven-day rollout

| Day | Add |
|-----|-----|
| 1 | The 3 rules above, in the Projects' instructions too |
| 2 | Juss & Co Site Project with mockups uploaded |
| 3 | GitHub daily digest (scheduled, quiet rule) |
| 4 | Release Desk Project; `release-receipt` routine |
| 5 | Gmail triage, drafts only |
| 6 | Notion handover page; Slack drafts |
| 7 | Review: hours saved vs the estimates in §1; cut what didn't help |

## Claude Code starter

- **Safe first task (changes nothing):** "Read CLAUDE.md and STATE.md, then list the 3 open items and what each needs from me."
- **CLAUDE.md:** already exists here; for a new repo, run `/init` and paste §8.
- **Plan Mode (Shift+Tab):** use it for anything touching settings, rulesets, deployments or more than 3 files. Skip it for one-file fixes with a clear done-line.

## Self-review

**Argue-with-me: 3 ways this could fail**
1. The live-site readback depends on a Cloudflare token that currently returns 401. Until it's renewed, task 3 saves nothing.
2. AI review alone is not merge authority. Require exact-head CI, browser evidence and one independent human GitHub approval.
3. Scheduled digests turn into noise if the quiet rule isn't followed. Judge them on day 7 and cut any that never led to an action.

**Final checks**
- Every task has a model.
- Every done-line is checkable in 5 seconds.
- Hours-saved figures are marked as estimates.
- The approval rule appears in §3, §6, §7 and §8.
