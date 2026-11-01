import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readPublicEvidence, serveEvidence } from "../workers/public-evidence.mjs";
const root = new URL("../", import.meta.url);
const read = (name) => readFileSync(new URL(name, root), "utf8");
const sha = "a".repeat(40);
const fetcher = async (url) => ({
  ok: url.includes("/jussray/Sekret-Bip/"),
  async json() { return [{ sha, commit: { committer: { date: "2026-10-31T00:00:00Z" } } }]; }
});
test("public feed is constrained to allowlisted source facts, not product or customer statuses", async () => {
  const data = await readPublicEvidence(fetcher, new Date("2026-11-01T00:00:00Z"));
  assert.equal(data.schema, "jussco/public-evidence@v1");
  assert.deepEqual(data.sources, [{ name: "Se'kret Bip", repo: "jussray/Sekret-Bip", sha, committedAt: "2026-10-31T00:00:00Z", kind: "public_source_commit_only" }]);
  assert.equal("st" in data.sources[0], false);
  assert.equal("verified" in data.sources[0], false);
});
test("malformed, private, and unavailable activity never becomes published evidence", async () => {
  const list = await readPublicEvidence(async () => ({ ok: true, async json() { return [{ sha: "false", commit: { committer: { date: "no" } } }]; } }));
  assert.deepEqual(list.sources, []);
});
test("endpoint rejects unrecognized paths, methods, and origins", async () => {
  for (const [url, method] of [
    ["https://www.jussco.company/api/internal", "GET"],
    ["https://www.jussco.company/api/public-evidence", "POST"],
    ["https://attacker.example/api/public-evidence", "GET"]
  ]) assert.equal((await serveEvidence(new Request(url, { method }), { fetcher, cache: null })).status, 404);
});
test("endpoint returns same-origin JSON with no cross-origin authorization", async () => {
  const res = await serveEvidence(new Request("https://www.jussco.company/api/public-evidence"), { fetcher, cache: null, now: new Date("2026-11-01T00:00:00Z") });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /application\/json/);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  assert.equal((await res.json()).sources.length, 1);
});
test("current homepage does not promote code activity into product launch claims", () => {
  const page = read("site/index.html");
  assert.match(page, /public-evidence/);
  assert.match(page, /Public source/);
  assert.doesNotMatch(page, /API deploy pending, so sign-in is offline/);
  assert.doesNotMatch(page, /Store open · awaiting first order/);
  assert.match(page, /Registry snapshot/);
});
test("registry contains no invented evidence or unverified order claim", () => {
  const data = JSON.parse(read("site/data/worlds.json"));
  assert.equal(data.worlds.length, 16);
  assert.equal(data.worlds.every(w => !w.evidence || Object.keys(w.evidence).length === 0), true);
  assert.equal(data.worlds.find(w => w.name === "Juss Beautiful Hair").label.includes("awaiting first order"), false);
});
test("Cloudflare deployment is gated by exact-head site proof and no red checks", () => {
  const workflow = read(".github/workflows/deploy-jussco.yml");
  for (const phrase of ["workflow_run:", "Juss & Co site browser proof", "workflow_run.head_sha", "check-runs", "wrangler.jsonc", "wrangler.evidence.jsonc", "CLOUDFLARE_API_TOKEN"])
    assert.ok(workflow.includes(phrase), phrase);
  assert.doesNotMatch(workflow, /pull_request:/);
});
