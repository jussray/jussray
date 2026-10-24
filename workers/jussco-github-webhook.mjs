const MAX_BYTES = 1048576;
const EVENTS = new Set([
  "ping", "push", "pull_request", "check_run", "workflow_run",
  "installation", "installation_repositories"
]);
const reply = (text, status) => new Response(text, {
  status,
  headers: {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  }
});
function hexToBytes(input) {
  if (!/^[a-f0-9]{64}$/i.test(input)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(input.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return reply(env.GITHUB_WEBHOOK_SECRET ? "ready" : "not configured", env.GITHUB_WEBHOOK_SECRET ? 200 : 503);
    }
    if (url.pathname !== "/github") return reply("Not found", 404);
    if (request.method !== "POST") return reply("Method not allowed", 405);
    const secret = env.GITHUB_WEBHOOK_SECRET;
    if (!secret || secret.length < 32) return reply("Webhook secret not configured", 503);
    const header = request.headers.get("x-hub-signature-256") || "";
    if (!/^sha256=[a-f0-9]{64}$/i.test(header)) return reply("Unauthorized", 401);
    const length = Number(request.headers.get("content-length") || "0");
    if (length > MAX_BYTES) return reply("Payload too large", 413);
    const body = await readLimitedBody(request);
    if (!body) return reply("Payload too large", 413);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signature = hexToBytes(header.slice(7));
    const authentic = await crypto.subtle.verify("HMAC", key, signature, body);
    if (!authentic) return reply("Unauthorized", 401);
    const event = request.headers.get("x-github-event") || "";
    if (!EVENTS.has(event)) return reply("Event ignored", 200);
    if (event === "ping") return reply("pong", 200);
    return reply("Signature verified; automation disabled", 202);
  }
};
