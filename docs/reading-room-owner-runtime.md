# Reading Room owner-only runtime candidate

Source only. No founder archive, credentials, owner identifier, backup payload, or private release is committed to this public repository.

The intended independent host is https://reading-room.jussco.company. Do not enable the route until an exact-host Cloudflare Access application with an explicit owner-only allow policy is configured. Configure OWNER_EMAIL and ACCESS_AUD out of band; the worker checks platform-authenticated Access context and exact audience on every request, not identity headers. Do not add a static assets binding (it prevents propagation of ctx.access). Disable workers.dev, preview URLs, public R2 development URL, and R2 custom domains. The example config intentionally has no public route or secrets.

A private, approved release object belongs in the private R2 bucket under releases/v25.html. Verify its digest against the local approved artifact. Do not put it in site/, Git history, CI artifacts, public feeds, sitemap or crawler discovery. Do not create billable resources without approval. Do not treat a successful test as authentication or deployment proof.

The GET / route serves only that fixed object after owner authorization. GET /api/backups lists content-addressed backups, GET /api/backups/:sha256 retrieves one, and POST /api/backups accepts bounded JSON with same-origin and owner checks. Backups are conditional-create, never overwritten or automatically restored. No external model calls or memory synchronization are enabled.

Focused check: node --test workers/reading-room/worker.test.mjs. These tests use synthetic identities and storage. Before release, prove the actual Access policy, wrong-user and anonymous rejection, exact host isolation, private bucket settings, owner login, archive digest and backup round trip. Test canonical public homepage regression and only then wire the generic My Juss login entry to the protected runtime. Keep SEO/AEO/GEO restricted to separately approved public descriptions.

Rollback: keep the public homepage untouched until release proof; withdraw the new route if required while retaining all stored data. No deletion or overwrite authorized.
