#!/usr/bin/env python3
"""Structural-only validation of a Juss runtime claim receipt.

Exit 0 = receipt STRUCTURE passes. It does not authenticate cited evidence,
authorities, actors, provider outcomes or the truth of a claim.
Exit 2 = invalid receipt. Network access and writes are not performed.
"""
import argparse
import json
import pathlib
import sys
from datetime import datetime

VALID_STATES = {'VERIFIED', 'FAILED', 'UNKNOWN', 'RECONCILING', 'BLOCKED'}
VALID_STATUSES = {'PROVEN', 'CANDIDATE', 'UNKNOWN'}
VALID_AUTH = {'AUTHORIZED', 'UNAUTHORIZED', 'UNKNOWN'}


def present(v):
    return isinstance(v, str) and bool(v.strip())


def list_strings(v):
    return isinstance(v, list) and bool(v) and all(present(x) for x in v)


def valid_timestamp(v):
    if not present(v):
        return False
    try:
        dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
        return dt.tzinfo is not None and dt.utcoffset() is not None
    except ValueError:
        return False


def validate(record):
    issues = []
    if not isinstance(record, dict):
        return ['receipt must be an object']
    if record.get('schema_version') != '1.0':
        issues.append('schema_version must be 1.0')
    state = record.get('state')
    if not isinstance(state, str) or state not in VALID_STATES:
        issues.append('state invalid or missing')
    if not isinstance(record.get('must'), list):
        issues.append('must must be an array (may be empty; cannot waive core proof)')

    slots = record.get('slots')
    if not isinstance(slots, dict):
        slots = {}
        issues.append('slots must be an object')
    for key in ('WHAT', 'WHERE', 'WHEN', 'HOW', 'WHY'):
        slot = slots.get(key)
        if not isinstance(slot, dict):
            issues.append(f'{key}: missing slot object')
            continue
        status, value, evidence = slot.get('status'), slot.get('value'), slot.get('evidence')
        if not isinstance(status, str) or status not in VALID_STATUSES:
            issues.append(f'{key}: status invalid')
        if status in ('PROVEN', 'CANDIDATE'):
            if value is None or (isinstance(value, str) and not value.strip()):
                issues.append(f'{key}: {status} requires a value')
            if not list_strings(evidence):
                issues.append(f'{key}: {status} requires evidence pointers')
            elif any(str(item) == str(value) for item in evidence):
                issues.append(f'{key}: value cannot serve as its own evidence')
        elif status == 'UNKNOWN' and value not in (None, 'UNKNOWN'):
            issues.append(f'{key}: UNKNOWN must not assert a factual value')
        if key == 'WHY' and status == 'PROVEN' and not list_strings(slot.get('causal_evidence')):
            issues.append('WHY: PROVEN requires causal_evidence pointers')
        if key == 'WHEN' and status == 'PROVEN' and not valid_timestamp(value):
            issues.append('WHEN: PROVEN requires timezone-aware observation timestamp')
    if state != 'VERIFIED':
        return issues  # non-verified states may record partial evidence

    for key in ('WHAT', 'WHERE', 'WHEN'):
        if not isinstance(slots.get(key), dict) or slots[key].get('status') != 'PROVEN':
            issues.append(f'{key}: VERIFIED requires PROVEN')
    runtime = record.get('runtime')
    if not isinstance(runtime, dict):
        runtime = {}
        issues.append('runtime must be an object for VERIFIED')
    if runtime.get('observed') is not True:
        issues.append('runtime.observed must be true')
    if not present(runtime.get('environment')):
        issues.append('runtime.environment required')
    if not list_strings(runtime.get('observation_evidence')):
        issues.append('runtime.observation_evidence pointers required')
    if runtime.get('artifact_required') is True and not present(runtime.get('artifact')):
        issues.append('artifact identity required by receipt')

    who = record.get('who')
    if not isinstance(who, dict):
        who = {}
        issues.append('who must be object for VERIFIED')

    def verify_role(role):
        actor = who.get(role)
        if not isinstance(actor, dict):
            issues.append(f'who.{role} missing')
            return None
        if not present(actor.get('actor')):
            issues.append(f'who.{role}.actor required')
        if actor.get('attribution') != 'PROVEN':
            issues.append(f'who.{role}.attribution must be PROVEN')
        if actor.get('authority_status') != 'AUTHORIZED':
            issues.append(f'who.{role}.authority_status must be AUTHORIZED for governed VERIFIED')
        for key in ('identity_evidence', 'action_evidence'):
            if not list_strings(actor.get(key)):
                issues.append(f'who.{role}.{key} required')
        identity_evidence, action_evidence = actor.get('identity_evidence'), actor.get('action_evidence')
        if list_strings(identity_evidence) and list_strings(action_evidence):
            if set(identity_evidence) & set(action_evidence):
                issues.append(f'who.{role}: identity and action evidence must be distinct')
        return actor

    verifier = verify_role('verified')
    executor = verify_role('executed') if runtime.get('execution_occurred') is True else None
    if executor and verifier:
        if executor.get('actor') == verifier.get('actor'):
            issues.append('executor cannot be sole verifier')
        ex_identity, vr_identity = executor.get('identity_evidence'), verifier.get('identity_evidence')
        if list_strings(ex_identity) and list_strings(vr_identity):
            if set(ex_identity) & set(vr_identity):
                issues.append('different actors cannot reuse identical identity evidence')

    if runtime.get('governed_action') is True:
        approval = record.get('approval')
        if not isinstance(approval, dict) or not all(present(approval.get(k)) for k in ('action_hash', 'scope', 'issuer', 'receipt')):
            issues.append('governed VERIFIED requires bound approval action_hash, scope, issuer, receipt')
    return issues


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('receipt', type=pathlib.Path)
    args = p.parse_args(argv)
    try:
        if args.receipt.stat().st_size > 2_000_000:
            raise ValueError('receipt too large (max 2 MB)')
        record = json.loads(args.receipt.read_text(encoding='utf-8'))
    except (OSError, ValueError, UnicodeError) as e:
        print(f'INVALID: unreadable JSON receipt: {e}')
        return 2
    issues = validate(record)
    if issues:
        print('INVALID STRUCTURE: ' + '; '.join(issues))
        return 2
    print('SCHEMA_OK; EXTERNAL EVIDENCE AND AUTHORITY NOT INDEPENDENTLY VERIFIED')
    return 0


if __name__ == '__main__':
    sys.exit(main())
