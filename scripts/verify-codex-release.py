#!/usr/bin/env python3
"""Fail-closed static check for repository Codex configuration and skills.

This checks files and manifests only. It is not Codex runtime or provider proof.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re
import sys
import tomllib

SKILLS = (
    "godmode-devil-ultrathink", "goalfix", "portfolio-bottleneck-finder",
    "juss-os", "futureyou-me-v10",
)
MODULES = (
    "receipts_check.py", "ultrathink.py", "test_modes.py",
    "truthmode.py", "confess.py", "evidence_core.py",
)
NAME = re.compile(r"""^name:\s*["']?([a-z0-9][a-z0-9-]*)["']?\s*$""", re.MULTILINE)
DESCRIPTION = re.compile(r"^description:\s*\S", re.MULTILINE)


def verify(root: Path) -> list[str]:
    root = root.resolve()
    errors: list[str] = []

    def read(rel: str) -> str | None:
        path = root / rel
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(root):
            errors.append(f"MISSING/UNSAFE {rel}")
            return None
        try:
            return path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as e:
            errors.append(f"UNREADABLE {rel}: {type(e).__name__}")
            return None

    read("AGENTS.md")
    raw = read(".codex/config.toml")
    if raw is not None:
        try:
            cfg = tomllib.loads(raw)
        except tomllib.TOMLDecodeError:
            errors.append("INVALID .codex/config.toml TOML")
        else:
            if cfg.get("model_reasoning_effort") != "high":
                errors.append("INVALID model_reasoning_effort")
            if cfg.get("model_reasoning_summary") != "auto":
                errors.append("INVALID model_reasoning_summary")
            if cfg.get("features", {}).get("multi_agent") is not True:
                errors.append("INVALID features.multi_agent")
            cap = cfg.get("agents", {}).get("max_concurrent_threads_per_session")
            if not isinstance(cap, int) or isinstance(cap, bool) or not 1 <= cap <= 8:
                errors.append("INVALID agents.max_concurrent_threads_per_session")
    for skill in SKILLS:
        rel = f".agents/skills/{skill}/SKILL.md"
        raw = read(rel)
        if raw is None:
            continue
        if not raw.startswith("---\n") or "\n---\n" not in raw[4:]:
            errors.append(f"INVALID FRONTMATTER {rel}")
            continue
        fm = raw[4:].split("\n---\n", 1)[0]
        match = NAME.search(fm)
        if not match or match.group(1) != skill:
            errors.append(f"INVALID NAME {rel}")
        if not DESCRIPTION.search(fm):
            errors.append(f"MISSING DESCRIPTION {rel}")
    for mod in MODULES:
        read(f".agents/skills/juss-os/scripts/{mod}")
    return errors


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = p.parse_args()
    errors = verify(args.root)
    for error in errors:
        print(f"FAIL {error}", file=sys.stderr)
    if errors:
        return 1
    print("PASS static Codex config, five skill manifests, six Juss OS scripts and AGENTS.md; runtime unverified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
