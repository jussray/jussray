import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from '@cloudflare/kv-asset-handler';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
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

      // Add CSP header to all responses
      const cspHeader = "default-src 'self'; script-src 'self' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self' fonts.googleapis.com; frame-ancestors 'none'";
      newResponse.headers.set('Content-Security-Policy', cspHeader);

      // Add HSTS header to all responses (1-hour timeout for rollback safety; escalate to 31536000 after cert renewal test)
      newResponse.headers.set('Strict-Transport-Security', 'max-age=3600; includeSubdomains; preload');

      return newResponse;
    } catch (e) {
      if (e instanceof NotFoundError) {
        return new Response('Not Found', { status: 404 });
      } else if (e instanceof MethodNotAllowedError) {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

interface Env {
  ASSETS: KVNamespace;
}

declare const __ASSET_MANIFEST: string | Record<string, string>;
