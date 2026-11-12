from __future__ import annotations
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import medusa

HERE = Path(__file__).resolve().parent
EXAMPLE = json.loads((HERE / "assessment.example.json").read_text())

class MedusaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.assessment = self.root / "case.json"
        self.doc = copy.deepcopy(EXAMPLE)

    def material(self, text="The approved source says independent evidence is required."):
        src = self.root / "source.txt"
        src.write_text(text)
        self.doc["material"] = [{"path": "source.txt", "sha256": hashlib.sha256(src.read_bytes()).hexdigest()}]
        return src

    def valid_stone(self):
        for a in self.doc["adversaries"]:
            a.update({"who": f"scenario actor ({a['kind']})", "why": "might benefit from bypass",
                      "reach": "only in-scope inputs", "first_try": "submit misleading content",
                      "frame_check": "founder controls classification; subjects may be harmed"})
        self.material()
        self.doc["stone"].update({"verified": True, "source_path": "source.txt", "quote": "independent evidence is required"})

    def save(self):
        self.assessment.write_text(json.dumps(self.doc))

    def test_empty_assessment_blocked(self):
        self.assertEqual(medusa.check({}, self.assessment)["gate"], "BLOCKED")

    def test_unverified_stone_holds(self):
        self.valid_stone()
        self.doc["stone"]["verified"] = False
        self.doc["stone"].pop("quote")
        self.save()
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "Hold")

    def test_stone_hash_only_rejected(self):
        self.valid_stone()
        del self.doc["stone"]["quote"]
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_out_of_scope_quote_source_blocked(self):
        self.valid_stone()
        self.doc["stone"]["source_path"] = "not-admitted.txt"
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_stone_mismatched_quote_blocked(self):
        self.valid_stone()
        self.doc["stone"]["quote"] = "This quotation was invented"
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_named_change_for_standing_high(self):
        self.valid_stone()
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "Proceed with named changes")

    def test_stale_evidence_blocks(self):
        source = self.material()
        self.doc["stone"].update({"verified": True, "source_path": "source.txt", "quote": "independent evidence"})
        source.write_text("modified")
        self.assertIn("STALE", str(medusa.check(self.doc, self.assessment)["errors"]))

    def test_unsupported_inferred_without_basis_blocks(self):
        self.valid_stone()
        f = self.doc["findings"][0]
        f["evidence_tag"] = "INFERRED"
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_rejected_high_without_quote_blocks(self):
        self.valid_stone()
        self.doc["findings"][0]["rebuttal"] = {"outcome": "Rejected", "defense": "trusted"}
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_two_evidence_dimensions_required(self):
        self.valid_stone()
        del self.doc["findings"][0]["source_of_knowledge"]
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_broad_custody_needs_decider_approval(self):
        self.valid_stone()
        self.doc["audience"] = ["Founder", "public"]
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")
        self.doc["audience_approved_by"] = "Founder"
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "Proceed with named changes")

    def test_custody_decider_required(self):
        self.valid_stone()
        self.doc["audience"] = ["public"]
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "BLOCKED")

    def test_routine_pass1_no_stone_required(self):
        self.doc["stakes"] = "routine"
        self.doc.pop("stone", None)
        self.doc.pop("adversaries", None)
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "Pass 1 only (advisory)")

    def test_irreversible_unreversible_stop(self):
        self.valid_stone()
        self.doc["stakes"] = "irreversible"
        self.doc["stone"].pop("reversal_evidence")
        self.assertEqual(medusa.check(self.doc, self.assessment)["gate"], "Stop")

    def test_only_always_exits_2(self):
        self.valid_stone()
        self.save()
        self.assertEqual(medusa.main(["gate", str(self.assessment), "--only"]), 2)

    def test_protect_final_scan_and_no_overwrites(self):
        self.valid_stone()
        self.doc["findings"][0]["scenario"] = "Authorization: Bearer artificialSecret123456"
        self.doc["findings"][0]["frame_check"] = "name@example.org"
        self.save()
        dest = self.root / "protected.json"
        self.assertEqual(medusa.main(["protect", str(self.assessment), "--out", str(dest)]), 0)
        data = dest.read_text()
        self.assertNotIn("artificialSecret123456", data)
        self.assertNotIn("name@example.org", data)
        self.assertEqual(medusa.main(["protect", str(self.assessment), "--out", str(dest)]), 2)

    def test_two_concurrent_snapshots_have_strict_sequence(self):
        self.valid_stone()
        self.save()
        ledger = self.root / "ledger.jsonl"
        cmd = [sys.executable, str(HERE / "medusa.py"), "snapshot", str(self.assessment), "--ledger", str(ledger)]
        a = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        b = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        aout, aerr = a.communicate(timeout=10)
        bout, berr = b.communicate(timeout=10)
        self.assertEqual((a.returncode, b.returncode), (0, 0), (aerr, berr))
        entries = medusa.verify_ledger_bytes(ledger.read_bytes())
        self.assertEqual([entry["seq"] for entry in entries], [1, 2])

    def test_truncated_chain_rejected(self):
        self.valid_stone()
        self.save()
        ledger = self.root / "ledger.jsonl"
        medusa.snapshot(self.assessment, ledger)
        ledger.write_bytes(ledger.read_bytes()[:-1])
        with self.assertRaises(ValueError):
            medusa.verify_ledger_bytes(ledger.read_bytes())

if __name__ == "__main__":
    unittest.main()
