#!/usr/bin/env python3
"""
worlds-patch-executor — readiness, governance, and cross-world impact for a patch queue.

Pure Python stdlib. No network. NEVER merges, deploys, or runs tests.
It reads what you declare (worlds + patches + evidence) and tells you, per patch:
READY / PENDING / BLOCKED, why, what it breaks downstream, and the next gate.

Truth rule: a check marked "pass" with no evidence link is UNVERIFIED -> PENDING, never READY.
"""
import argparse
import fnmatch
import json
import os
import sys
from collections import defaultdict, deque

GOV_FILES = ["GOVERNANCE.md", "AGENTS.md", "CLAUDE.md", "CODEOWNERS", ".github/CODEOWNERS",
             "SECURITY.md", "CONTRIBUTING.md", "docs/GOVERNANCE.md"]


def build_graph(worlds):
    ids = {w["id"] for w in worlds}
    problems = []
    deps = {}
    for w in worlds:
        ds = w.get("depends_on", [])
        for d in ds:
            if d not in ids:
                problems.append(f"world '{w['id']}' depends on unknown world '{d}'")
        deps[w["id"]] = [d for d in ds if d in ids]
    rdeps = defaultdict(list)
    for w, ds in deps.items():
        for d in ds:
            rdeps[d].append(w)
    return deps, rdeps, problems


def cycle_members(deps):
    """Return only nodes that are actually members of dependency cycles."""
    index = 0
    stack, on_stack = [], set()
    indices, lowlink, members = {}, {}, set()

    def visit(v):
        nonlocal index
        indices[v] = lowlink[v] = index
        index += 1
        stack.append(v)
        on_stack.add(v)
        for w in deps.get(v, []):
            if w not in indices:
                visit(w)
                lowlink[v] = min(lowlink[v], lowlink[w])
            elif w in on_stack:
                lowlink[v] = min(lowlink[v], indices[w])
        if lowlink[v] == indices[v]:
            component = []
            while True:
                w = stack.pop()
                on_stack.remove(w)
                component.append(w)
                if w == v:
                    break
            if len(component) > 1 or (len(component) == 1 and v in deps.get(v, [])):
                members.update(component)

    for v in sorted(deps):
        if v not in indices:
            visit(v)
    return sorted(members)


def topo_order(deps):
    indeg = {w: len(ds) for w, ds in deps.items()}
    rd = defaultdict(list)
    for w, ds in deps.items():
        for d in ds:
            rd[d].append(w)
    q = deque(sorted(w for w, n in indeg.items() if n == 0))
    order = []
    while q:
        n = q.popleft()
        order.append(n)
        for m in sorted(rd[n]):
            indeg[m] -= 1
            if indeg[m] == 0:
                q.append(m)
    return order, cycle_members(deps)


def walk(start, edges):
    seen, q = [], deque([start])
    while q:
        n = q.popleft()
        for m in sorted(edges.get(n, [])):
            if m not in seen and m != start:
                seen.append(m)
                q.append(m)
    return seen


def touches(files, patterns):
    return sorted({f for f in files for p in patterns if fnmatch.fnmatch(f, p)})


def upstream_failing_checks(world):
    """Required checks that are recorded as failing on a world's own baseline."""
    gov, checks = world.get("governance", {}), world.get("state", {}).get("checks", {})
    return [n for n in gov.get("required_checks", []) if checks.get(n, {}).get("status") == "fail"]


def eval_patch(p, W, deps, rdeps, cyclic, upstream_status):
    wid = p.get("world")
    blocked, pending, risks, proof = [], [], [], []
    if wid not in W:
        return dict(patch=p, world=None, status="BLOCKED",
                    blocked=[f"target world '{wid}' not declared in worlds file"],
                    pending=[], risks=[], proof=[], downstream=[], upstream=[], impact="UNKNOWN")
    w = W[wid]
    gov = w.get("governance", {})
    state = w.get("state", {})
    files = p.get("files", [])

    if gov.get("frozen"):
        blocked.append(f"world frozen ({gov.get('freeze_reason', 'no reason given')})")
    if wid in cyclic:
        blocked.append("world is in a dependency cycle — order cannot be proven")
    hit_forbidden = touches(files, gov.get("forbidden_paths", []))
    if hit_forbidden:
        blocked.append(f"touches forbidden paths: {', '.join(hit_forbidden)}")

    checks = {**state.get("checks", {}), **p.get("checks", {})}
    for name in gov.get("required_checks", []):
        c = checks.get(name)
        if c is None:
            pending.append(f"check '{name}' not run")
            continue
        st, ev = c.get("status", "unknown"), c.get("evidence")
        if st == "fail":
            blocked.append(f"check '{name}' FAILING" + (f" ({ev})" if ev else ""))
        elif st == "pass" and isinstance(ev, str) and ev.strip():
            proof.append(f"VERIFIED {name}: {ev.strip()}")
        elif st == "pass":
            pending.append(f"check '{name}' says pass but has no evidence — UNVERIFIED")
        else:
            pending.append(f"check '{name}' status '{st}'")

    approvals = set(p.get("approvals", []))
    need = set(gov.get("requires_approval_from", []))
    hit_protected = touches(files, gov.get("protected_paths", []))
    if hit_protected:
        need |= set(gov.get("protected_approvers", gov.get("requires_approval_from", [])) or ["owner"])
    missing = sorted(need - approvals)
    if missing:
        why = f" (protected paths: {', '.join(hit_protected)})" if hit_protected else ""
        pending.append(f"approval missing from: {', '.join(missing)}{why}")

    upstream = walk(wid, deps)
    cyclic_upstream = sorted(set(upstream) & set(cyclic))
    if cyclic_upstream:
        blocked.append(f"upstream dependency cycle involves: {', '.join(cyclic_upstream)} — order cannot be proven")
    for u in upstream:
        st = upstream_status.get(u)
        if st == "BLOCKED":
            pending.append(f"upstream world '{u}' has a BLOCKED patch — fix upstream first")
        elif st == "PENDING":
            pending.append(f"upstream world '{u}' has a PENDING patch — land upstream first")
        failing = upstream_failing_checks(W[u])
        if failing:
            pending.append(f"upstream world '{u}' is failing {', '.join(failing)} — never build on bad state")

    down = walk(wid, rdeps)
    public = touches(files, gov.get("public_surface", []))
    if not down:
        impact = "NONE"
    elif public:
        impact = "HIGH"
        risks.append(f"changes public surface ({', '.join(public)}) consumed by: {', '.join(down)}")
    elif not gov.get("public_surface"):
        impact = "UNKNOWN"
        risks.append(f"world declares no public_surface — cannot tell if dependents {', '.join(down)} are affected; treat as HIGH")
    else:
        impact = "LOW"
    for d in down:
        dg = W[d].get("governance", {})
        if dg.get("frozen"):
            risks.append(f"downstream '{d}' is frozen — it cannot absorb a breaking change right now")
    if not files:
        risks.append("patch lists no files — impact and protected-path checks are blind")

    status = "BLOCKED" if blocked else ("PENDING" if pending else "READY")
    return dict(patch=p, world=w, status=status, blocked=blocked, pending=pending,
                risks=risks, proof=proof, downstream=down, upstream=upstream, impact=impact)


def evaluate(worlds, patches):
    ids = [w.get("id") for w in worlds]
    missing_ids = [i for i, wid in enumerate(ids) if not isinstance(wid, str) or not wid.strip()]
    if missing_ids:
        raise ValueError(f"world entries missing a non-empty string id at indexes: {missing_ids}")
    duplicates = sorted({wid for wid in ids if ids.count(wid) > 1})
    if duplicates:
        raise ValueError(f"duplicate world id(s): {', '.join(duplicates)}")
    W = {w["id"]: w for w in worlds}
    deps, rdeps, problems = build_graph(worlds)
    order, cyclic = topo_order(deps)
    rank = {w: i for i, w in enumerate(order)}
    queue = sorted(patches, key=lambda p: rank.get(p.get("world"), 10**6))
    world_status, results = {}, []
    sev = {"BLOCKED": 2, "PENDING": 1, "READY": 0}
    for p in queue:
        r = eval_patch(p, W, deps, rdeps, cyclic, world_status)
        results.append(r)
        wid = p.get("world")
        prev = world_status.get(wid)
        if prev is None or sev[r["status"]] > sev[prev]:
            world_status[wid] = r["status"]
    return dict(W=W, deps=deps, rdeps=rdeps, problems=problems, order=order,
                cyclic=cyclic, results=results, world_status=world_status)


def next_gate(r):
    if r["blocked"]:
        return f"Clear hard stop: {r['blocked'][0]}"
    if r["pending"]:
        return f"Resolve: {r['pending'][0]}"
    pol = (r["world"] or {}).get("governance", {}).get("merge_policy", "human-approval")
    down = r["downstream"]
    tail = f" Then re-run required checks in: {', '.join(down)}." if down else ""
    return f"Merge per policy '{pol}' (a human decides — this tool never merges).{tail}"


def render_md(E, title="Worlds Patch Report"):
    out = [f"# {title}", ""]
    res = E["results"]
    counts = {s: sum(1 for r in res if r["status"] == s) for s in ("READY", "PENDING", "BLOCKED")}
    out.append(f"**Patches:** {len(res)} · READY {counts['READY']} · PENDING {counts['PENDING']} · BLOCKED {counts['BLOCKED']}")
    out.append(f"**Safe execution order (upstream → downstream):** {' → '.join(E['order']) or '—'}")
    if E["cyclic"]:
        out.append(f"**⚠ Dependency cycle:** {', '.join(E['cyclic'])} — order unprovable until broken.")
    for pr in E["problems"]:
        out.append(f"**⚠ Map problem:** {pr}")
    out += ["", "| Patch | World | Status | Impact | Downstream |", "|---|---|---|---|---|"]
    for r in res:
        p = r["patch"]
        out.append(f"| {p.get('id','?')} | {p.get('world')} | {r['status']} | {r['impact']} | {', '.join(r['downstream']) or '—'} |")
    untouched = [w for w in E["order"] if w not in E["world_status"]]
    if untouched:
        out.append(f"\n_Worlds with no queued patch:_ {', '.join(untouched)}")
    out.append("")
    for r in res:
        p = r["patch"]
        w = r["world"] or {}
        gov = w.get("governance", {})
        out.append(f"## {p.get('id','?')} → {p.get('world')} — {r['status']}")
        out.append(f"- **REALITY:** commit `{p.get('commit','?')}` on `{p.get('branch', w.get('branch','?'))}` in {w.get('repo','?')}. Owner: {gov.get('owner','undeclared')}. Depends on: {', '.join(r['upstream']) or 'nothing'}.")
        out.append(f"- **FIX:** {p.get('summary','(no summary)')} — files: {', '.join(p.get('files', [])) or 'none listed'}")
        proof = r["proof"] or ["none — nothing here is VERIFIED yet"]
        out.append("- **PROOF:** " + "; ".join(proof))
        if r["blocked"]:
            out.append("- **BLOCKED BY:** " + "; ".join(r["blocked"]))
        if r["pending"]:
            out.append("- **PENDING ON:** " + "; ".join(r["pending"]))
        out.append("- **RISK:** " + ("; ".join(r["risks"]) if r["risks"] else f"impact {r['impact']}"))
        out.append(f"- **ROLLBACK:** {p.get('rollback') or ('git revert ' + str(p.get('commit','<sha>')))}" + (f" — then re-verify {', '.join(r['downstream'])}" if r["downstream"] else ""))
        out.append(f"- **NEXT GATE:** {next_gate(r)}")
        out.append("")
    return "\n".join(out)


def to_json(E):
    def clean(r):
        return {k: v for k, v in r.items() if k != "world"} | {"next_gate": next_gate(r)}
    return json.dumps(dict(order=E["order"], cyclic=E["cyclic"], problems=E["problems"],
                           world_status=E["world_status"], results=[clean(r) for r in E["results"]]), indent=2)


def scan_docs(worlds):
    out = ["# Governance docs found", ""]
    for w in worlds:
        lp = w.get("local_path")
        if not lp:
            out.append(f"- {w['id']}: no local_path declared — UNKNOWN (open the repo and look for {', '.join(GOV_FILES[:4])})")
            continue
        if not os.path.isdir(lp):
            out.append(f"- {w['id']}: local_path '{lp}' not found — BLOCKED")
            continue
        found = [g for g in GOV_FILES if os.path.exists(os.path.join(lp, g))]
        out.append(f"- {w['id']}: {', '.join(found) if found else 'none — governance is only what worlds.json declares'}")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("worlds")
    ap.add_argument("patches", nargs="?")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--ready", action="store_true", help="only READY patches")
    ap.add_argument("--depends-on", metavar="WORLD", help="only patches in worlds that (transitively) depend on WORLD, plus WORLD")
    ap.add_argument("--impact", metavar="WORLD", help="show what a change in WORLD reaches")
    ap.add_argument("--scan-docs", action="store_true")
    a = ap.parse_args()

    try:
        with open(a.worlds, encoding="utf-8") as f:
            wdoc = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        ap.error(f"cannot read worlds file: {e}")
    worlds = wdoc["worlds"] if isinstance(wdoc, dict) else wdoc
    if a.scan_docs:
        print(scan_docs(worlds))
        return
    patches = []
    if a.patches:
        try:
            with open(a.patches, encoding="utf-8") as f:
                pdoc = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            ap.error(f"cannot read patches file: {e}")
        patches = pdoc["patches"] if isinstance(pdoc, dict) else pdoc

    if not isinstance(worlds, list) or not all(isinstance(w, dict) for w in worlds):
        ap.error("worlds must be a JSON array of objects (or an object with a 'worlds' array)")
    if not isinstance(patches, list) or not all(isinstance(p, dict) for p in patches):
        ap.error("patches must be a JSON array of objects (or an object with a 'patches' array)")
    try:
        E = evaluate(worlds, patches)
    except (KeyError, TypeError, ValueError) as e:
        ap.error(str(e))

    if a.impact:
        if a.impact not in E["W"]:
            sys.exit(f"unknown world '{a.impact}'")
        down = walk(a.impact, E["rdeps"])
        gov = E["W"][a.impact].get("governance", {})
        print(f"# Impact of changing '{a.impact}'\n")
        print(f"- Reaches: {', '.join(down) or 'nothing — leaf world'}")
        print(f"- Public surface (changes here hit dependents): {', '.join(gov.get('public_surface', [])) or 'UNDECLARED — assume everything'}")
        for d in down:
            dg = E["W"][d].get("governance", {})
            print(f"- After patching, re-verify '{d}': {', '.join(dg.get('required_checks', [])) or 'no checks declared — add one'}" + (" ⚠ FROZEN" if dg.get("frozen") else ""))
        return

    title = "Worlds Patch Report"
    if a.depends_on:
        if a.depends_on not in E["W"]:
            sys.exit(f"unknown world '{a.depends_on}'")
        scope = set(walk(a.depends_on, E["rdeps"])) | {a.depends_on}
        E["results"] = [r for r in E["results"] if r["patch"].get("world") in scope]
        title += f" — worlds depending on {a.depends_on}"
    if a.ready:
        E["results"] = [r for r in E["results"] if r["status"] == "READY"]
        title += " — READY now"

    print(to_json(E) if a.json else render_md(E, title))


if __name__ == "__main__":
    main()
