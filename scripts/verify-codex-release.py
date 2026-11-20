#!/usr/bin/env python3
"""Fail-closed static check for repository Codex configuration and skills.

This checks files and manifests only. It is not Codex runtime or provider proof.
"""
from __future__ import annotations
import argparse
import ast
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
    # Dependency closure: every non-stdlib import in the six modules must resolve to a shipped sibling.
    scripts = ".agents/skills/juss-os/scripts"
    for mod in MODULES:
        src = read(f"{scripts}/{mod}")
        if src is None:
            continue
        try:
            tree = ast.parse(src, filename=mod)
        except SyntaxError:
            errors.append(f"SYNTAX {scripts}/{mod}")
            continue
        names: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                names.update(a.name.split(".")[0] for a in node.names)
            elif isinstance(node, ast.ImportFrom):
                if node.level:
                    errors.append(f"RELATIVE IMPORT {scripts}/{mod}")
                elif node.module:
                    names.add(node.module.split(".")[0])
        for name in sorted(names - set(sys.stdlib_module_names) - {"__future__"}):
            dep = root / scripts / f"{name}.py"
            if not dep.is_file() or dep.is_symlink():
                errors.append(f"UNRESOLVED IMPORT {name} in {scripts}/{mod}")
    # The .agents copies are exports of skills/juss-authored. Every exported file that still has a
    # source counterpart must match it byte for byte, so an edit to either side cannot silently
    # leave Codex loading a stale copy. Codex-only files (no source counterpart) are allowed.
    for skill in SKILLS:
        export_dir = root / ".agents/skills" / skill
        source_dir = root / "skills/juss-authored" / skill
        if not export_dir.is_dir() or not source_dir.is_dir():
            continue
        for exported in sorted(export_dir.rglob("*")):
            if not exported.is_file() or exported.is_symlink() or "__pycache__" in exported.parts:
                continue
            rel = exported.relative_to(export_dir)
            source = source_dir / rel
            if source.is_file() and not source.is_symlink() and source.read_bytes() != exported.read_bytes():
                errors.append(f"OUT OF SYNC .agents/skills/{skill}/{rel.as_posix()} != skills/juss-authored/{skill}/{rel.as_posix()}")
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
    print("PASS static Codex config, five skill manifests, six Juss OS scripts, export sync and AGENTS.md; runtime unverified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
