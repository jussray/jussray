# /medusa — Offline Security Assessment Validator

Medusa A-D: Evidence-native security assessment validation, redacted export, and immutable ledger.

## Trigger

`/medusa`

## What it does

Validates security findings against structured attack-surface models before any authorization or action:

- **Gate mode** (`medusa gate <assessment.json`): Validate assessment structure, evidence integrity, adversary modeling
- **Protect mode** (`medusa protect <assessment> --out <redacted.json`): Sanitize and export assessment (redact tokens, emails, paths)
- **Snapshot mode** (`medusa snapshot <assessment> --ledger <ledger.jsonl`): Record immutable assessment snapshot
- **Verify ledger** (`medusa verify-ledger <ledger.jsonl`): Confirm chain integrity

## Assessment structure

```json
{
  "target": { "name": "...", "version": "...", "date": "..." },
  "decider": "founder@email",
  "audience": ["founder@email", "..."],
  "stakes": "routine|consequential|irreversible",
  "coverage": ["premise", "assumptions", "failure_modes", "misuse", "authority", ...],
  "adversaries": [
    {"kind": "outsider|insider|untrusted_input", "who": "...", "why": "...", "reach": "...", "first_try": "...", "frame_check": "..."}
  ],
  "stone": {"assumption": "...", "verified": true|false, "reversal_evidence": "..."},
  "findings": [
    {
      "id": "unique-id",
      "severity": "Critical|High|Medium|Low",
      "evidence_tag": "VERIFIED|INFERRED|UNVERIFIED",
      "source_of_knowledge": "AUTHORED|OBSERVED|USER-REPORTED|VERIFIED",
      "scenario": "attack scenario",
      "consequence": "impact if successful",
      "likelihood": "high|medium|low",
      "likelihood_basis": "why this likelihood",
      "source_path": "file.md",
      "quote": "exact text from source",
      "rebuttal": {"outcome": "Stands|Narrows|Rejected", "defense": "..."}
    }
  ],
  "material": [
    {"path": "doc.md", "sha256": "..."}
  ],
  "next_gate": "founder decision or next check"
}
```

## Authority contract

- **Never merges**, deploys, or executes actions
- **Validates structure only**, not independent truth
- **Exit 0** = structural validity (NOT authorization)
- **Exit 2** = errors, blocked findings, or unverified stone
- **Evidence-only advisory**: manual privacy review required

## Usage in founder workflow

1. Author assessment in JSON
2. Run `medusa gate <assessment.json>` — verify structure before stakes
3. On consequential/irreversible: model all adversaries + Pass 2–4
4. Run `medusa protect --out <redacted.json>` — sanitize before sharing
5. Run `medusa snapshot --ledger <ledger.jsonl>` — immutable record
6. **Founder decides** whether to act on findings

## Redaction rules

Automatically redacts: bearer tokens, API keys, client secrets, passwords, emails, local paths.

## Requirements

- Python 3.9+ (stdlib only, no network)
- Runs locally only (never fetches from remote)
- Founder authors all findings and material
- No synthetic or auto-generated assessments

## Next gate

Founder authorization to act on rebuttal-passed High/Critical findings.
