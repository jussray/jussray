#!/usr/bin/env python3
"""Medusa A-D: offline assessment validator and redacted exporter.

Never fetches, modifies an assessment, executes a response, or authorizes a release.
The user authors findings and controls material admission. Exit 0 means only that
local assessment checks passed; it is NOT a security or authorization verdict.
"""
from __future__ import annotations
import argparse
import hashlib
import datetime
import json
import os
from pathlib import Path
import re
import sys

CLASSES = {"premise", "assumptions", "failure_modes", "misuse", "authority",
           "evidence", "reversibility", "lindy", "second_order", "cheaper_path"}
ADVERSARIES = {"outsider", "insider", "untrusted_input"}
STAKES = {"routine", "consequential", "irreversible"}
SEVERITY = {"Critical", "High", "Medium", "Low"}
ORIGINS = {"AUTHORED", "OBSERVED", "USER-REPORTED", "VERIFIED"}
EVIDENCE = {"VERIFIED", "INFERRED", "UNVERIFIED"}
REBUTTALS = {"Stands", "Narrows", "Rejected"}
SENSITIVE = [
    re.compile(r"(?i)\bauthorization\s*[:=]\s*bearer\s+[^\s,;\"']+"),
    re.compile(r"(?i)\bbearer\s+[a-z0-9._~+/-]{8,}"),
    re.compile(r"(?i)(?:access[_-]?token|api[_-]?key|client[_-]?secret|password|authorization|refresh[_-]?token)\s*[:=]\s*[^\s,;\"']+"),
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
]


def redact(text):
    for pattern in SENSITIVE:
        text = pattern.sub("[REDACTED]", text)
    return text


def sanitized(value):
    if isinstance(value, str):
        return redact(value)
    if isinstance(value, list):
        return [sanitized(v) for v in value]
    if isinstance(value, dict):
        return {k: ("[LOCAL PATH REDACTED]" if k in ("path", "source_path") else sanitized(v))
                for k, v in value.items()}
    return value


def filled(obj, *keys):
    return isinstance(obj, dict) and all(isinstance(obj.get(k), str) and obj[k].strip() for k in keys)


def substantive(obj, *keys):
    return filled(obj, *keys) and all(obj[k].strip().lower() not in
        {"unknown", "todo", "tbd", "pending", "none", "n/a", "unspecified"} for k in keys)


def verify_quote(item, documents, errors, prefix):
    """Require exact in-scope text quote; hash-only is never VERIFIED."""
    path = item.get("source_path")
    quote = item.get("quote")
    if not isinstance(path, str) or not isinstance(quote, str) or not quote.strip():
        errors.append(f"{prefix}: VERIFIED requires source_path and nonblank quote")
        return
    source = documents.get(path)
    if source is None:
        errors.append(f"{prefix}: quote source not admitted/current")
    elif quote not in source:
        errors.append(f"{prefix}: quoted passage not found in admitted source")


def check(doc, assessment_path):
    errors, notes = [], []
    if not isinstance(doc, dict):
        return {"gate": "BLOCKED", "exit": 2, "errors": ["assessment must be an object"]}
    target = doc.get("target")
    if not filled(target, "name", "version", "date"):
        errors.append("target must name version and date")
    if not filled(doc, "decider", "stakes", "next_gate") or doc.get("stakes") not in STAKES:
        errors.append("decider, valid stakes and next_gate are required")
    stakes = doc.get("stakes")
    audience = doc.get("audience")
    if not isinstance(audience, list) or not audience or doc.get("decider") not in audience:
        errors.append("audience must include decider")
    elif len(audience) > 1 and doc.get("audience_approved_by") != doc.get("decider"):
        errors.append("broad audience needs explicit decider approval in assessment")

    docs = {}
    material = doc.get("material", [])
    if not isinstance(material, list):
        errors.append("material must be a list")
        material = []
    for index, item in enumerate(material):
        if not filled(item, "path", "sha256"):
            errors.append(f"material #{index}: path and sha256 required")
            continue
        path = item["path"]
        if path in docs:
            errors.append(f"material #{index}: duplicate path")
            continue
        source = (assessment_path.parent / path).resolve()
        try:
            if not source.is_file() or (assessment_path.parent / path).is_symlink():
                raise ValueError("not a regular unlinked file")
            blob = source.read_bytes()
        except (OSError, ValueError):
            errors.append(f"material #{index}: unreadable source")
            continue
        if hashlib.sha256(blob).hexdigest() != item["sha256"]:
            errors.append(f"material #{index}: STALE hash mismatch")
            continue
        docs[path] = blob.decode("utf-8", errors="replace")

    coverage = doc.get("coverage")
    if not isinstance(coverage, list) or not set(coverage).issubset(CLASSES):
        errors.append("coverage must name valid attack classes")
    elif stakes != "routine" and set(coverage) != CLASSES:
        errors.append("consequential/irreversible requires all ten Pass 1 classes")
    elif not coverage:
        errors.append("at least one Pass 1 class required")
    if stakes != "routine":
        adv = doc.get("adversaries")
        if not isinstance(adv, list) or {a.get("kind") for a in adv if isinstance(a, dict)} != ADVERSARIES:
            errors.append("Pass 2 requires outsider, insider and untrusted_input")
        else:
            for a in adv:
                if not substantive(a, "kind", "who", "why", "reach", "first_try", "frame_check"):
                    errors.append("Pass 2 adversary fields incomplete")

    stone = doc.get("stone")
    if stakes != "routine" and not filled(stone, "assumption"):
        errors.append("Pass 3 stone assumption required")
    if not isinstance(stone, dict):
        stone = {}
    if stakes != "routine" and not filled(stone, "reversal_evidence"):
        notes.append("stone has no named reversal")
    verified = stone.get("verified") is True
    if stakes != "routine" and stone.get("verified") not in (True, False):
        errors.append("stone verified must be boolean")
    if verified:
        verify_quote(stone, docs, errors, "stone")

    findings = doc.get("findings")
    if not isinstance(findings, list):
        errors.append("findings must be a list")
        findings = []
    ids, standing = set(), []
    for i, f in enumerate(findings):
        tag = f"finding #{i}"
        if not filled(f, "id", "source", "frame_check", "severity", "attack", "scenario", "consequence", "evidence_tag", "source_of_knowledge", "likelihood", "likelihood_basis"):
            errors.append(f"{tag}: missing required field")
            continue
        if f["id"] in ids:
            errors.append(f"{tag}: repeated ID")
        ids.add(f["id"])
        if f["severity"] not in SEVERITY or f["evidence_tag"] not in EVIDENCE or f["source_of_knowledge"] not in ORIGINS or f["likelihood"] not in ("high", "medium", "low"):
            errors.append(f"{tag}: invalid severity, evidence tag, origin or likelihood")
        if f["evidence_tag"] == "VERIFIED":
            verify_quote(f, docs, errors, tag)
        elif f["evidence_tag"] == "UNVERIFIED" and not filled(f, "check_needed"):
            errors.append(f"{tag}: UNVERIFIED needs check_needed")
        elif f["evidence_tag"] == "INFERRED" and not filled(f, "inference_basis"):
            errors.append(f"{tag}: INFERRED needs inference_basis")
        if f["severity"] in ("Critical", "High") and stakes != "routine":
            reb = f.get("rebuttal")
            if not filled(reb, "outcome", "defense") or reb["outcome"] not in REBUTTALS:
                errors.append(f"{tag}: Pass 4 rebuttal missing")
            else:
                if reb["outcome"] == "Rejected":
                    verify_quote(reb, docs, errors, f"{tag} rejection")
                else:
                    standing.append(f["id"])
                    if not filled(f, "named_change"):
                        errors.append(f"{tag}: standing High/Critical needs named_change")

    if errors:
        verdict = "BLOCKED"
    elif stakes != "routine" and not filled(stone, "reversal_evidence"):
        verdict = "Stop"
    elif stakes == "routine":
        verdict = "Pass 1 only (advisory)"
    elif not verified:
        verdict = "Hold"
    elif standing:
        verdict = "Proceed with named changes"
    else:
        verdict = "Proceed"
    # 0 is structural validity, not action authority. 2 blocks errors/stone Hold/Stop.
    return {"gate": verdict, "exit": 2 if verdict in ("BLOCKED", "Hold", "Stop") else 0,
            "errors": errors, "notes": notes, "standing_ids": standing,
            "authority": "evidence_only", "can_authorize": False,
            "material_count": len(docs), "finding_count": len(findings),
            "independent_truth_verified": False, "manual_privacy_review_required": True}


def load(path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def exclusive_json(destination, value):
    if destination.exists() or destination.is_symlink():
        raise ValueError("refusing to overwrite export")
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(destination, flags, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(value, fh, indent=2, ensure_ascii=True)
            fh.write("\n")
            fh.flush()
            os.fsync(fh.fileno())
    except BaseException:
        destination.unlink(missing_ok=True)
        raise


def _canon(record):
    return json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def verify_ledger_bytes(data):
    entries = []
    previous = "0" * 64
    if data and not data.endswith(b"\n"):
        raise ValueError("truncated final record")
    for line in data.splitlines():
        try:
            item = json.loads(line)
        except (ValueError, UnicodeDecodeError):
            raise ValueError("broken ledger record") from None
        expected = dict(item)
        digest = expected.pop("entry_hash", None)
        if (item.get("seq") != len(entries) + 1 or item.get("prev_hash") != previous or
                digest != hashlib.sha256(_canon(expected)).hexdigest()):
            raise ValueError("broken ledger continuity")
        previous = digest
        entries.append(item)
    return entries


def snapshot(assessment, ledger):
    try:
        import fcntl  # Linux/Mac file lock: no unguarded non-Unix fallback
    except ImportError:
        raise ValueError("flock unavailable: refuse concurrent snapshots") from None
    source = assessment.read_bytes()
    if check(json.loads(source), assessment.resolve())["errors"]:
        raise ValueError("invalid assessment")
    flags = os.O_CREAT | os.O_RDWR | os.O_APPEND
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    with os.fdopen(os.open(ledger, flags, 0o600), "r+b", buffering=0) as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            fh.seek(0)
            entries = verify_ledger_bytes(fh.read())
            previous = entries[-1]["entry_hash"] if entries else "0" * 64
            record = {"seq": len(entries) + 1, "prev_hash": previous,
                      "assessment_sha256": hashlib.sha256(source).hexdigest(),
                      "captured_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                      "authority": "evidence_only", "can_authorize": False}
            record["entry_hash"] = hashlib.sha256(_canon(record)).hexdigest()
            fh.seek(0, os.SEEK_END)
            fh.write(_canon(record) + b"\n")
            os.fsync(fh.fileno())
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)
    return record


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for command in ("gate", "protect", "snapshot", "verify-ledger"):
        sp = sub.add_parser(command)
        if command in ("gate", "protect", "snapshot"):
            sp.add_argument("assessment", type=Path)
        if command == "verify-ledger":
            sp.add_argument("ledger", type=Path)
        if command == "snapshot":
            sp.add_argument("--ledger", type=Path, required=True)
        if command == "gate":
            sp.add_argument("--only", action="store_true", help="diagnostic only: always exit 2")
        if command == "protect":
            sp.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if args.command == "verify-ledger":
            entries = verify_ledger_bytes(args.ledger.read_bytes())
            print(json.dumps({"chain": "VALID", "records": len(entries), "authority": "evidence_only"}))
            return 0
        if args.command == "snapshot":
            record = snapshot(args.assessment, args.ledger)
            print(json.dumps({"snapshot": "RECORDED", "seq": record["seq"], "authority": "evidence_only"}))
            return 0
        doc = load(args.assessment)
        result = check(doc, args.assessment.resolve())
        if args.command == "gate":
            print(json.dumps(result, indent=2))
            return 2 if args.only else result["exit"]
        if result["errors"]:
            print("Medusa: assessment invalid; refusing export", file=sys.stderr)
            return 2
        export = sanitized({"assessment": doc, "checker": result,
                            "warning": "Evidence-only advisory; not release authority"})
        # final scan on serialized bytes, not just input fields
        output = json.dumps(export, ensure_ascii=True)
        if redact(output) != output:
            print("Medusa: final redaction scan failed", file=sys.stderr)
            return 2
        exclusive_json(args.out, export)
        print("PROTECTED: redacted assessment created; release authorization remains separate")
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print("Medusa: input/output unavailable or unsafe; no authorization", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
