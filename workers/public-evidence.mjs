/* Juss & Co public source activity only. No private data, release state, or inferred outcomes. */
const REPOS = Object.freeze([
  ["Se'kret Bip","jussray/Sekret-Bip"],
  ["Founder Control Room","jussray/founder-control-room"],
  ["Chief AI","jussray/chief-ai-machine"],
  ["Juss Beautiful Hair","jussray/jussbeautifulhair-site"],
  ["StoryEngine","jussray/StoryEngine"],
  ["Sync Party","jussray/sync-party-game"],
  ["PromptOS","jussray/promptos"],
  ["SolContinuity","jussray/solcontinuity"],
  ["SleepWealth Agent","jussray/SleepWealth-Agent"],
  ["Solwealth","jussray/SolWealth-Meteora-"],
  ["Think Tank","jussray/THINK-TANK"]
]);
const VALID_SHA = /^[0-9a-f]{40}$/i;
const ALLOW_ORIGIN = new Set(["https://www.jussco.company", "https://jussco.company"]);
export async function readPublicEvidence(fetcher, now = new Date()) {
  const sources = await Promise.all(REPOS.map(async ([name, repo]) => {
    try {
      const response = await fetcher("https://api.github.com/repos/" + repo + "/commits?per_page=1", {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "JussCo-Public-Evidence/1" },
        signal: AbortSignal.timeout(4000)
      });
      if (!response.ok) return null;
      const list = await response.json();
      const first = Array.isArray(list) ? list[0] : null;
      const sha = first && first.sha;
      const committedAt = first?.commit?.committer?.date;
      if (!VALID_SHA.test(sha || "") || !Number.isFinite(Date.parse(committedAt))) return null;
      return { name, repo, sha, committedAt, kind: "public_source_commit_only" };
    } catch { return null; }
  }));
  return {
    schema: "jussco/public-evidence@v1",
    asOf: now.toISOString(),
    meaning: "Public source activity only; no verified deployment, purchases, readiness, or customer outcomes.",
    sources: sources.filter(Boolean)
  };
}
export async function serveEvidence(request, { fetcher = fetch, cache = globalThis.caches?.default, ctx, now = new Date() } = {}) {
  const url = new URL(request.url);
  if (url.pathname !== "/api/public-evidence" || request.method !== "GET") {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (!ALLOW_ORIGIN.has(url.origin)) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const key = new Request(url.origin + url.pathname);
  if (cache) {
    try { const hit = await cache.match(key); if (hit) return hit; } catch { /* cache unavailable */ }
  }
  const payload = await readPublicEvidence(fetcher, now);
  const response = new Response(JSON.stringify(payload), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=1800", "X-Content-Type-Options": "nosniff" }
  });
  if (cache && ctx?.waitUntil && payload.sources.length) {
    ctx.waitUntil(Promise.resolve().then(() => cache.put(key, response.clone())).catch(() => {}));
  }
  return response;
}
export default { fetch(request, env, ctx) { return serveEvidence(request, { ctx }); } };
