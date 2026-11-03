import copy
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
P = ROOT / 'runtime-kernel' / 'scripts' / 'check_receipt.py'


def module():
    spec = importlib.util.spec_from_file_location('runtime_checker', P)
    checker = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(checker)
    return checker


def valid_receipt():
    return {
        'schema_version': '1.0',
        'state': 'VERIFIED',
        'must': [],
        'slots': {
            'WHAT': {'status': 'PROVEN', 'value': 'actual served response', 'evidence': ['trace:ui/12']},
            'WHERE': {'status': 'PROVEN', 'value': 'https://example.test', 'evidence': ['trace:ui/12']},
            'WHEN': {'status': 'PROVEN', 'value': '2026-11-03T19:00:00Z', 'evidence': ['trace:ui/12']},
            'HOW': {'status': 'UNKNOWN', 'value': None, 'evidence': []},
            'WHY': {'status': 'UNKNOWN', 'value': None, 'evidence': []},
        },
        'who': {
            'executed': {'actor': 'deploy-bot', 'attribution': 'PROVEN', 'authority_status': 'AUTHORIZED', 'identity_evidence': ['signed:deploy-bot'], 'action_evidence': ['build:12']},
            'verified': {'actor': 'independent-check', 'attribution': 'PROVEN', 'authority_status': 'AUTHORIZED', 'identity_evidence': ['signed:check'], 'action_evidence': ['trace:ui/12']},
        },
        'runtime': {'observed': True, 'environment': 'staging', 'observation_evidence': ['trace:ui/12'], 'artifact_required': True, 'artifact': 'sha256:9df0', 'execution_occurred': True, 'governed_action': False}
    }


class RuntimeReceiptTests(unittest.TestCase):
    def test_valid_structural_receipt(self):
        self.assertEqual(module().validate(valid_receipt()), [])

    def test_no_runtime_proof_is_rejected_even_if_must_empty(self):
        data = valid_receipt()
        data['runtime']['observed'] = False
        self.assertTrue(module().validate(data))

    def test_value_cannot_self_certify(self):
        data = valid_receipt()
        data['slots']['WHERE']['evidence'] = ['https://example.test']
        self.assertTrue(module().validate(data))

    def test_verifier_executor_must_be_independent(self):
        data = valid_receipt()
        data['who']['verified']['actor'] = 'deploy-bot'
        self.assertTrue(module().validate(data))

    def test_unauthorized_executor_blocks_verified(self):
        data = valid_receipt()
        data['who']['executed']['authority_status'] = 'UNAUTHORIZED'
        self.assertTrue(module().validate(data))

    def test_causal_why_requires_distinct_causal_evidence(self):
        data = valid_receipt()
        data['slots']['WHY'] = {'status': 'PROVEN', 'value': 'deploy caused failure', 'evidence': ['ticket:123']}
        self.assertTrue(module().validate(data))

    def test_governed_action_needs_approval_binding(self):
        data = valid_receipt()
        data['runtime']['governed_action'] = True
        self.assertTrue(module().validate(data))

    def test_proven_without_evidence_rejected(self):
        data = valid_receipt()
        data['slots']['WHAT']['evidence'] = []
        self.assertTrue(module().validate(data))

    def test_null_identity_evidence_rejected_without_exception(self):
        data = valid_receipt()
        data['who']['verified']['identity_evidence'] = None
        self.assertTrue(module().validate(data))

    def test_nested_unhashable_action_evidence_rejected_without_exception(self):
        data = valid_receipt()
        data['who']['executed']['action_evidence'] = [{'unexpected': ['nested']}]
        self.assertTrue(module().validate(data))

    def test_unhashable_status_fields_are_rejected_without_exception(self):
        for field, value in (
            ('state', []),
            ('slot_status', {}),
            ('authority_status', []),
        ):
            with self.subTest(field=field):
                data = valid_receipt()
                if field == 'state':
                    data['state'] = value
                elif field == 'slot_status':
                    data['slots']['WHAT']['status'] = value
                else:
                    data['who']['verified']['authority_status'] = value
                self.assertTrue(module().validate(data))

    def test_bad_schema_version_rejected(self):
        data = valid_receipt()
        data['schema_version'] = '0.1'
        self.assertTrue(module().validate(data))


if __name__ == '__main__': unittest.main()
