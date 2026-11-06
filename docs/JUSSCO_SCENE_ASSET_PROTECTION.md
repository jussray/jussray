# Juss & Co cinematic world assets — asset governance receipt

**Scope:** Juss & Co public site, original user-approved scenic compositions for day, dusk and night.

## Public display (derived WebP assets only)
- `site/assets/scenes/juss-world-day-5ea951ad.webp`
- `site/assets/scenes/juss-world-dusk-a3df3f32.webp`
- `site/assets/scenes/juss-world-night-1b88cfea.webp`

The public URLs are referenced by `site/assets/juss-living-world.css` and `site/assets/juss-inner-world.css`.
`site/assets/juss-day-night.mjs` selects day, dusk, and night from the viewer's local time,
without geolocation, an account requirement, or a public theme selector.

## Preserve and protect
1. Preserve the exact user-provided original images separately from the public website; do **not** commit originals, drafts, or prompt history into `site/`. The supplied owner-side ZIP contains originals and display derivatives.
2. Keep the selected composition intact. Do not repaint the mountains, glass buildings, water, trees, or Creation Core merely to swap the time of day.
3. The SHA-256 provenance manifest is in `site/data/juss-world-asset-receipt.json`; validate the actual bytes before changing its status to shipped.
4. Public assets are necessarily downloadable by browsers. Copyright/licensing boundaries and provenance may help deter misuse, but no client-side script, right-click block, noindex tag, watermark removal, or browser fingerprint can make public image bytes uncopyable.
5. Do not block ordinary website users, accessibility features, crawlers or intended public product flows to protect display assets.
6. Publish only verified, intended public variants. Founder-only source material and overrides belong behind appropriate authentication, never in `site/` or the frontend bundle.

## Deployment gate
The image-derivative binaries have **not** been pushed to GitHub by this text-only connector workflow. The repository uses the existing SVG fallback until they are installed at the exact paths above. The manifest status remains `display_derivatives_prepared_locally_not_yet_committed_to_github`.

Required before marking the images deployed:
- Place all three WebP files from the owner package into `site/assets/scenes/`.
- Verify SHA-256 against the manifest; verify day/dusk/night URL responses and rendering at mobile and desktop sizes.
- Run `node --test scripts/juss-atmosphere.test.mjs scripts/juss-day-night.test.mjs`, then source browser tests and exact-head CI.
- Reconcile `main`, confirm required approvals, and separately verify Cloudflare production readback.
