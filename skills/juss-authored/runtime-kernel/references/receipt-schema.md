# Runtime receipt schema — structural contract (v1.0)

**STATUS:** Local structural validator implemented, not provider proof. `scripts/check_receipt.py` reads one JSON file and returns `SCHEMA_OK` when the *declared fields* are internally consistent. It cannot authenticate actors, signatures, receipts, runtime observations, deployment IDs, or founder authorization. Resolve evidence pointers with independent provider/browser reads before claiming a live outcome.

```json
{
  "schema_version": "1.0",
  "state": "VERIFIED",
  "must": [],
  "slots": {
    "WHAT": {"status": "PROVEN", "value": "GET /health returned 200", "evidence": ["trace:run-12/http.json"]},
    "WHERE": {"status": "PROVEN", "value": "https://example.test/health", "evidence": ["trace:run-12/http.json"]},
    "WHEN": {"status": "PROVEN", "value": "2026-11-03T19:00:00Z", "evidence": ["trace:run-12/http.json"]},
    "HOW": {"status": "UNKNOWN", "value": null, "evidence": []},
    "WHY": {"status": "UNKNOWN", "value": null, "evidence": []}
  },
  "runtime": {
    "observed": true,
    "environment": "test",
    "observation_evidence": ["trace:run-12/http.json"],
    "artifact_required": true,
    "artifact": "sha256:<actual-artifact-hash>",
    "execution_occurred": true,
    "governed_action": false
  },
  "who": {
    "executed": {"actor": "authorized-bot", "attribution": "PROVEN", "authority_status": "AUTHORIZED", "identity_evidence": ["signed:build-12"], "action_evidence": ["deployment:build-12"]},
    "verified": {"actor": "independent-monitor", "attribution": "PROVEN", "authority_status": "AUTHORIZED", "identity_evidence": ["signed:monitor-3"], "action_evidence": ["trace:run-12/http.json"]}
  }
}
```

- `state`: one of `VERIFIED`, `FAILED`, `UNKNOWN`, `RECONCILING`, `BLOCKED`.
- 5W1H status: `PROVEN`, `CANDIDATE`, `UNKNOWN`; `PROVEN` or `CANDIDATE` requires value and separate evidence pointers. WHY PROVEN additionally requires `causal_evidence` pointers.
- `must` may be empty, but it does **not** remove WHAT/WHERE/WHEN or runtime obligations.
- `runtime.observation_evidence` is required for `VERIFIED`, and `artifact` when `artifact_required` is true. Declared pointers may be fabricated; a human or separate authorized verifier must inspect them.
- If `execution_occurred` is true, `who.executed` and `who.verified` must name independent actors with distinct identity evidence. Auth status is checked structurally, **not** against provider grants.
- For `governed_action: true`, include `approval` object with `action_hash`, `scope`, `issuer`, `receipt`. The validator checks presence only; execution must independently verify binding, current grant, expiry, and intended target.
- Never put secret values, customer records, or raw private prompts in receipts. Store pointers to access-controlled artifacts.
- A structurally valid receipt is **unverified externally** until evidence and authorization have been read back at the real runtime boundary.
