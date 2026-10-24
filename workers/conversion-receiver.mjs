// Juss & Co first-party aggregated conversion counter; no visitor-level storage.
const ACTIONS = Object.freeze({
  contact_click: ['copy_email', 'email'],
  world_detail_open: ['world_card'],
  project_open: ['world_cta'],
  app_open: ['games', 'standalone_system'],
  shop_click: ['jbh'],
  call_click: ['phone'],
  whatsapp_click: ['whatsapp'],
});
const FIELDS = ['event', 'project', 'surface', 'action', 'schema'];
const STATEMENT = `INSERT INTO conversion_daily (day, event, action, count)
VALUES (?, ?, ?, 1)
ON CONFLICT(day, event, action)
DO UPDATE SET count = count + 1`;
const HEADERS = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const answer = (code, extra = {}) => new Response(null, { status: code, headers: { ...HEADERS, ...extra } });

async function limitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const bytes = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 512) {
        await reader.cancel().catch(() => {});
        return null;
      }
      bytes.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const part of bytes) { all.set(part, offset); offset += part.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(all);
}

export function validEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const keys = Object.keys(body).sort();
  if (JSON.stringify(keys) !== JSON.stringify([...FIELDS].sort())) return false;
  if (body.project !== 'juss-and-co' || body.surface !== 'front_door' || body.schema !== 'v1') return false;
  return Object.hasOwn(ACTIONS, body.event) && ACTIONS[body.event].includes(body.action);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isHealthProbe = url.pathname === '/_telemetry/v1/health';
    if (url.hostname !== 'www.jussco.company' ||
        (url.pathname !== '/_telemetry/v1' && !isHealthProbe) || url.search) return answer(404);
    if (request.method !== 'POST') return answer(405, { Allow: 'POST' });
    if (request.headers.get('origin') !== 'https://www.jussco.company') return answer(403);
    const fetchSite = request.headers.get('sec-fetch-site');
    if (fetchSite && fetchSite !== 'same-origin') return answer(403);
    if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('content-type') || '')) return answer(415);
    const length = request.headers.get('content-length');
    if (length !== null && (+length > 512 || !Number.isFinite(+length))) return answer(413);
    let obj;
    try { const raw = await limitedBody(request); if (raw === null) return answer(413); obj = JSON.parse(raw); }
    catch { return answer(400); }
    if (isHealthProbe) {
      // Explicit, read-only diagnostic. Cannot insert or simulate a customer conversion.
      if (!obj || Array.isArray(obj) || Object.keys(obj).length !== 1 || obj.probe !== 'health-v1') return answer(400);
      if (!env?.DB || typeof env.DB.prepare !== 'function') return answer(503);
      try {
        // Validates every required aggregate column without inserting or changing data.
        // An empty table is healthy: .first() may return null, but the SELECT must succeed.
        await env.DB.prepare(
          'SELECT day, event, action, count FROM conversion_daily LIMIT 1'
        ).first();
        return answer(204);
      } catch { return answer(503); }
    }
    if (!validEvent(obj)) return answer(400);
    if (!env?.DB || typeof env.DB.prepare !== 'function') return answer(503);
    try {
      const day = new Date().toISOString().slice(0, 10);
      await env.DB.prepare(STATEMENT).bind(day, obj.event, obj.action).run();
      return answer(204);
    } catch { return answer(503); }
  },
};
