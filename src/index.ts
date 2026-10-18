import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from '@cloudflare/kv-asset-handler';

interface RequestMetrics {
  timestamp: number;
  method: string;
  path: string;
  status: number;
  duration: number;
  country?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    try {
      // Handle .well-known/security.txt with proper content-type (RFC 9116)
      if (path === '/.well-known/security.txt') {
        try {
          const securityTxtResponse = await getAssetFromKV(
            { request, waitUntil: ctx.waitUntil },
            {
              ASSET_NAMESPACE: env.ASSETS,
              ASSET_MANIFEST: typeof __ASSET_MANIFEST === 'string' ? JSON.parse(__ASSET_MANIFEST) : __ASSET_MANIFEST,
            }
          );

          if (securityTxtResponse.status === 200) {
            const securityResponse = new Response(securityTxtResponse.body, securityTxtResponse);
            securityResponse.headers.set('Content-Type', 'text/plain; charset=utf-8');
            securityResponse.headers.set('Cache-Control', 'public, max-age=86400');
            securityResponse.headers.set('Strict-Transport-Security', 'max-age=3600; includeSubdomains; preload');
            return securityResponse;
          }
        } catch (e) {
          // Fall through to 404 handling
        }
      }

      // Get the asset from static files
      const response = await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil },
        {
          ASSET_NAMESPACE: env.ASSETS,
          ASSET_MANIFEST: typeof __ASSET_MANIFEST === 'string' ? JSON.parse(__ASSET_MANIFEST) : __ASSET_MANIFEST,
        }
      );

      // Clone the response so we can modify headers
      const newResponse = new Response(response.body, response);

      // Add CSP header to all responses with report-uri for monitoring
      const cspHeader = "default-src 'self'; script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self' fonts.googleapis.com; frame-ancestors 'none'; report-uri /_csp-report";
      newResponse.headers.set('Content-Security-Policy', cspHeader);

      // Add HSTS header to all responses (1-hour timeout for rollback safety; escalate to 31536000 after cert renewal test)
      newResponse.headers.set('Strict-Transport-Security', 'max-age=3600; includeSubdomains; preload');

      // Add additional security headers
      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'DENY');
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');

      // Log metrics to KV for monitoring
      const duration = Date.now() - startTime;
      const metrics: RequestMetrics = {
        timestamp: Date.now(),
        method,
        path,
        status: newResponse.status,
        duration,
        country: request.headers.get('cf-ipcountry') ?? undefined,
      };

      ctx.waitUntil(
        logMetrics(env, metrics).catch(err => {
          console.error('Metrics logging error:', err);
        })
      );

      return newResponse;
    } catch (e) {
      const duration = Date.now() - startTime;
      let statusCode = 500;

      if (e instanceof NotFoundError) {
        statusCode = 404;
      } else if (e instanceof MethodNotAllowedError) {
        statusCode = 405;
      }

      // Log error metrics
      const errorMetrics: RequestMetrics = {
        timestamp: Date.now(),
        method,
        path,
        status: statusCode,
        duration,
      };

      ctx.waitUntil(logMetrics(env, errorMetrics).catch(() => {}));

      return new Response(
        statusCode === 404 ? 'Not Found' : statusCode === 405 ? 'Method Not Allowed' : 'Internal Server Error',
        { status: statusCode }
      );
    }
  },
};

async function logMetrics(env: Env, metrics: RequestMetrics): Promise<void> {
  if (!env.METRICS_KV) return;

  const hour = new Date(metrics.timestamp).toISOString().slice(0, 13);
  const key = `metrics:${hour}`;

  try {
    const existing = await env.METRICS_KV.get(key, 'json');
    const data: any = existing || { requests: [], errors: [], avgLatency: 0 };

    if (metrics.status >= 400) {
      data.errors.push({ status: metrics.status, path: metrics.path, time: new Date(metrics.timestamp).toISOString() });
    } else {
      data.requests.push({ status: metrics.status, duration: metrics.duration });
    }

    await env.METRICS_KV.put(key, JSON.stringify(data), { expirationTtl: 604800 }); // 7 days
  } catch (err) {
    console.error('Failed to log metrics:', err);
  }
}

interface Env {
  ASSETS: KVNamespace;
  METRICS_KV?: KVNamespace;
}

declare const __ASSET_MANIFEST: string | Record<string, string>;
