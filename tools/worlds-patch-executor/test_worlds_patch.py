#!/usr/bin/env python3
import importlib.util
import pathlib
import unittest

MODULE_PATH = pathlib.Path(__file__).with_name("worlds_patch.py")
spec = importlib.util.spec_from_file_location("worlds_patch", MODULE_PATH)
worlds_patch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worlds_patch)


class WorldsPatchRegressionTests(unittest.TestCase):
    def test_cycle_members_excludes_downstream_nodes(self):
        deps = {"A": ["B"], "B": ["A"], "C": ["A"]}
        order, cyclic = worlds_patch.topo_order(deps)
        self.assertEqual(order, [])
        self.assertEqual(cyclic, ["A", "B"])

    def test_downstream_of_cycle_is_blocked_without_false_cycle_attribution(self):
        worlds = [
            {"id": "A", "depends_on": ["B"]},
            {"id": "B", "depends_on": ["A"]},
            {"id": "C", "depends_on": ["A"]},
        ]
        result = worlds_patch.evaluate(worlds, [{"id": "p", "world": "C", "files": ["x.py"]}])["results"][0]
        self.assertEqual(result["status"], "BLOCKED")
        self.assertTrue(any("upstream dependency cycle involves: A, B" in reason for reason in result["blocked"]))
        self.assertFalse(any("world is in a dependency cycle" in reason for reason in result["blocked"]))

    def test_duplicate_world_ids_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "duplicate world id"):
            worlds_patch.evaluate([{"id": "A"}, {"id": "A"}], [])

    def test_blank_evidence_does_not_verify_pass(self):
        worlds = [{
            "id": "A",
            "governance": {"required_checks": ["unit"]},
        }]
        patches = [{
            "id": "p",
            "world": "A",
            "files": ["x.py"],
            "checks": {"unit": {"status": "pass", "evidence": "   "}},
        }]
        result = worlds_patch.evaluate(worlds, patches)["results"][0]
        self.assertEqual(result["status"], "PENDING")
        self.assertEqual(result["proof"], [])
        self.assertTrue(any("UNVERIFIED" in reason for reason in result["pending"]))


if __name__ == "__main__":
    unittest.main()
