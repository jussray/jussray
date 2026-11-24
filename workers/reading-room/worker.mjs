const ORIGIN = 'https://reading-room.jussco.company';
const RELEASE = 'releases/v25.html';
const LIMIT = 8 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
function reply(body, status=200, type='text/plain; charset=utf-8') {
  return new Response(body,{status,headers:{...HEADERS,'Content-Type':type}});
}
const json = (value,status=200) => reply(JSON.stringify(value),status,'application/json; charset=utf-8');
async function boundedBody(request) {
  const reader=request.body?.getReader();
  if(!reader) return new Uint8Array();
  const parts=[]; let length=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>LIMIT){await reader.cancel();return null;}parts.push(value);}
  } finally {reader.releaseLock();}
  const result=new Uint8Array(length);let offset=0;
  for(const part of parts){result.set(part,offset);offset+=part.byteLength;}return result;
}
function validBackup(value){
  return value && typeof value==='object' && !Array.isArray(value) && Array.isArray(value.records) && value.records.length>0 && value.records.length<=20000 && value.records.every(r=>r && typeof r.title==='string' && typeof r.content==='string');
}
export default {
  async fetch(request,env,ctx){
    try {
      const url=new URL(request.url);
      if(url.origin!==ORIGIN)return reply('Not found',404);
      if(!env.OWNER_EMAIL || !env.ACCESS_AUD || !env.VAULT)return reply('Service unavailable',503);
      if(!ctx?.access || ctx.access.aud!==env.ACCESS_AUD)return reply('Owner access required',403);
      let identity;
      try{identity=await ctx.access.getIdentity();}catch{return reply('Owner access required',403);}
      if(typeof identity?.email!=='string' || identity.email.toLowerCase()!==env.OWNER_EMAIL.toLowerCase())return reply('Owner access required',403);
      const path=url.pathname;
      if(request.method==='GET' && path==='/'){
        const object=await env.VAULT.get(RELEASE);
        return object?reply(object.body,200,'text/html; charset=utf-8'):reply('Release unavailable',503);
      }
      if(request.method==='GET' && path==='/api/backups'){
        const cursor=url.searchParams.get('cursor');
        const result=await env.VAULT.list({prefix:'backups/',limit:100,...(cursor?{cursor}:{})});
        return json({backups:result.objects.map(o=>o.key.slice(8,-5)).filter(k=>HASH.test(k)),cursor:result.truncated?result.cursor:null});
      }
      if(request.method==='GET' && path.startsWith('/api/backups/')){
        const hash=path.slice('/api/backups/'.length);
        if(!HASH.test(hash))return reply('Not found',404);
        const object=await env.VAULT.get('backups/'+hash+'.json');
        return object?reply(object.body,200,'application/json; charset=utf-8'):reply('Not found',404);
      }
      if(request.method==='POST' && path==='/api/backups'){
        if(request.headers.get('Origin')!==ORIGIN)return reply('Forbidden',403);
        if(request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return reply('JSON required',415);
        const bytes=await boundedBody(request);if(!bytes)return reply('Backup too large',413);
        let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return reply('Invalid backup',400);}
        if(!validBackup(value))return reply('Invalid backup',400);
        const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
        const sha256=Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
        const created=await env.VAULT.put('backups/'+sha256+'.json',bytes,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
        return json({sha256,created:!!created},created?201:200);
      }
      return reply('Not found',404);
    }catch{return reply('Service unavailable',503);}
  }
};
