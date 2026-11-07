from __future__ import annotations
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

CHECK = Path(__file__).resolve().parents[1] / "scripts" / "verify-codex-release.py"
SKILLS = ("godmode-devil-ultrathink", "goalfix", "portfolio-bottleneck-finder", "juss-os", "futureyou-me-v10")
MODULES = ("receipts_check.py", "ultrathink.py", "test_modes.py", "truthmode.py", "confess.py", "evidence_core.py")


def fixture(root):
    (root / ".codex").mkdir()
    (root / ".codex/config.toml").write_text(
        'model_reasoning_effort = "high"\nmodel_reasoning_summary = "auto"\n'
        '[features]\nmulti_agent = true\n[agents]\nmax_concurrent_threads_per_session = 4\n')
    (root / "AGENTS.md").write_text("# agent rules\n")
    for name in SKILLS:
        d = root / ".agents/skills" / name
        d.mkdir(parents=True)
        (d / "SKILL.md").write_text(f"---\nname: {name}\ndescription: Release proof.\n---\n# proof\n")
    script = root / ".agents/skills/juss-os/scripts"
    script.mkdir()
    for name in MODULES:
        (script / name).write_text("# test fixture\n")


def check(root):
    return subprocess.run([sys.executable, str(CHECK), "--root", str(root)], capture_output=True, text=True)


class ReleaseTests(unittest.TestCase):
    def test_complete_bundle_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root); p = check(root)
            self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
            self.assertIn("PASS", p.stdout)

    def test_missing_dependency_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / ".agents/skills/juss-os/scripts/evidence_core.py").unlink()
            p = check(root)
            self.assertNotEqual(p.returncode, 0)
            self.assertIn("evidence_core.py", p.stderr)

    def test_skill_name_mismatch_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / ".agents/skills/goalfix/SKILL.md").write_text("---\nname: other\ndescription: test\n---\n")
            p = check(root)
            self.assertNotEqual(p.returncode, 0)
            self.assertIn("goalfix", p.stderr)

    def test_multi_agent_disabled_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            f = root / ".codex/config.toml"
            f.write_text(f.read_text().replace("multi_agent = true", "multi_agent = false"))
            p = check(root)
            self.assertNotEqual(p.returncode, 0)
            self.assertIn("multi_agent", p.stderr)

    def test_missing_root_instructions_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); fixture(root)
            (root / "AGENTS.md").unlink()
            p = check(root)
            self.assertNotEqual(p.returncode, 0)
            self.assertIn("AGENTS.md", p.stderr)


if __name__ == "__main__":
    unittest.main()
