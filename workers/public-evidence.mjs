// First-party public GitHub activity. Not launch, revenue, or customer evidence.
const PUBLIC_REPOS = Object.freeze([
  ["Se'kret Bip","jussray/Sekret-Bip"],
  ["Founder Control Room","jussray/founder-control-room"],
  ["Chief AI","jussray/chief-ai-machine"],
  ["Juss Beautiful Hair","jussray/jussbeautifulhair-site"],
  ["StoryEngine","jussray/StoryEngine"],
  ["Sync Party","jussray/sync-party-game"],
  ["SolContinuity","jussray/solcontinuity"],
  ["SleepWealth Agent","jussray/SleepWealth-Agent"],
  ["Think Tank","jussray/THINK-TANK"]
]);
const HOSTS = new Set(["https://www.jussco.company","https://jussco.company"]);
const SHA=/^[0-9a-f]{40}$/i;
export async function observePublicSources(fetcher=fetch, now=new Date()) {
  const sources=(await Promise.all(PUBLIC_REPOS.map(async ([name,repo])=>{
    try {
      const response=await fetcher("https://api.github.com/repos/"+repo+"/commits?per_page=1",{
        headers: {Accept:"application/vnd.github+json","User-Agent":"JussCo-public-evidence/1"},
        signal:AbortSignal.timeout(4500)
      });
      if(!response.ok)return null;
      const list=await response.json();
      const first=Array.isArray(list)?list[0]:null;
      const sha=first?.sha,committedAt=first?.commit?.committer?.date;
      if(!SHA.test(sha||"")||typeof committedAt!=="string"||!Number.isFinite(Date.parse(committedAt)))return null;
      return {name,repo,sha,committedAt,kind:"public_source_commit_only"};
    }catch{return null;}
  }))).filter(Boolean);
  return {
    schema:"jussco/public-evidence@v1",
    observedAt:now.toISOString(),
    limitation:"Public source commits only. Not deployment, availability, purchase, or launch verification.",
    sources
  };
}
export async function servePublicEvidence(request,{fetcher=fetch,cache=globalThis.caches?.default??null,ctx,now=new Date()}={}) {
  const url=new URL(request.url);
  if(request.method!=="GET"||url.pathname!=="/api/public-evidence"||!HOSTS.has(url.origin)) {
    return new Response("Not found",{status:404,headers:{"Cache-Control":"no-store"}});
  }
  const cacheKey=new Request(url.origin+"/api/public-evidence");
  if(cache) {
    try {const cached=await cache.match(cacheKey);if(cached)return cached;}catch {}
  }
  const payload=await observePublicSources(fetcher,now);
  const result=new Response(JSON.stringify(payload),{
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"public, max-age=0, s-maxage=900",
      "X-Content-Type-Options":"nosniff"
    }
  });
  if(payload.sources.length&&cache&&ctx?.waitUntil) {
    ctx.waitUntil(Promise.resolve().then(()=>cache.put(cacheKey,result.clone())).catch(()=>{}));
  }
  return result;
}
export default {fetch(request,env,ctx){return servePublicEvidence(request,{ctx});}};
