# JussCo GitHub App webhook

**Scope:** GitHub repo `jussray/jussray`, Cloudflare Worker `jussco-github-webhook`, public webhook endpoint `https://hooks.jussco.company/github`.

## Security and behavior

- Validates GitHub's `X-Hub-Signature-256` HMAC-SHA256 using raw body bytes and the encrypted Cloudflare Worker secret binding `GITHUB_WEBHOOK_SECRET`.
- Missing/short secrets fail closed; limits request bodies to 1 MiB; doesn't store or log GitHub payloads.
- Signed ping: HTTP 200; signed allowed event: HTTP 202; invalid signature: HTTP 401; unconfigured secret: HTTP 503; oversized body: HTTP 413.
- `GET /health` reports **secret-binding configuration only**, not GitHub connectivity.
- No mutations, synchronization, deployment, merges, or agent fan-out. Those require a separately reviewed processor and idempotency contract.

## Manual credential setup

1. In Cloudflare Workers, open `jussco-github-webhook` > Settings > Variables and Secrets and create encrypted `GITHUB_WEBHOOK_SECRET` (random, 32+ characters). Do not commit the secret or paste it into a chat/issue.
2. In the **existing** GitHub App's webhook settings, set URL `https://hooks.jussco.company/github` and enter **the identical secret**.
3. Keep GitHub App installation limited to the necessary repositories and permissions. The GitHub Actions token step should restrict `repositories:` where feasible.
4. Trigger a GitHub App webhook `ping` delivery and confirm HTTP 200. Check bad/missing-signature requests are rejected.
5. Confirm the GitHub App private-key secret `APP_PRIVATE_KEY` is a valid PEM if Actions still fails with `Invalid keyData`; that PEM is a **different** credential from `GITHUB_WEBHOOK_SECRET`.

## Tests

```bash
node --test tests/jussco-github-webhook.test.mjs
```

## Evidence / next gate

As of Oct 22, 2026, Cloudflare reported this Worker deployed (100% traffic) and a bound custom domain with a TLS certificate. The `GITHUB_WEBHOOK_SECRET` binding was absent. A real, successful GitHub delivery and fully healthy DNS/HTTPS from an external network have **not** been verified. Local Node tests passed 10 cases but do not prove the live handshake.

Do not merge this PR or enable processing until secure setup, live ping, CI checks, and review succeed.
