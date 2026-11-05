// Preview server for Railway. Cloudflare remains the production site authority.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site'));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.pdf':'application/pdf' };
createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://preview.local').pathname);
    if (path.includes('\0') || path.split('/').some(part => part.startsWith('.') && part !== '.well-known')) throw Error('invalid path');
    let file = await realpath(join(root, path === '/' ? 'index.html' : path));
    if (!file.startsWith(root + sep)) throw Error('outside root');
    if ((await stat(file)).isDirectory()) file = await realpath(join(file, 'index.html'));
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw Error('invalid file');
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');
