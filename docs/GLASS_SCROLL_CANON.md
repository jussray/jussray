# Juss & Co Glass Scroll — Canonical Design Contract v1
Decision date: 2026-11-05
Scope: Juss & Co public founder-studio pages in `jussray/jussray/site`. Other independent products may adopt the pattern using their own brand tokens and approval; this document does **not** establish that those apps are already updated.

## Experience
- One cohesive cinematic composition: midnight sky stays fixed behind the page; readable glass panels and the foreground content scroll normally.
- Two independent, subtle star twinkles (different durations and phase offsets); no parallax moving the text.
- Translucent frosted glass reveals the sky while maintaining foreground contrast. Preserve each product's content, identity, and working controls.
- Keep the homepage cinematic art and the first welcome screen before project discovery; glass is a shared surface treatment, not a replacement hero.
- Do not use `background-attachment: fixed`: use independent CSS `position: fixed` layers to support iPhone Safari. No JS, external animation service, canvas, tracking, fingerprinting, or background network request is required.
- `prefers-reduced-motion: reduce` disables twinkling. Without backdrop-filter support, use an opaque-enough panel fallback.
- Native scrolling, focus states, touch targets of at least 40px, responsive spacing, and keyboard navigation must remain functional. Never use transparent text or low-contrast glass as an aesthetic shortcut.
- Scope the CSS behind `body.jc-glass-scroll`; use `/assets/glass-scroll.css` as the sole source for the shared effect. Avoid copying drifted variants across pages.

## Canonical surfaces
`index.html`, `services.html` (Work with Juss), `work.html` (Selected Work), `portfolio.html`, `creative-history.html`, and `licensing.html`. The Games experience and each independently branded app retain their own layout and implementation boundaries.

## Search, GEO, answer and retrieval optimization
- Use a unique descriptive title, one canonical URL, one meta description, matching Open Graph/Twitter metadata, and semantic headings on each page.
- On `services.html`, the main service concepts are website/Shopify repair, software and AI workflows. Present prices as **starting prices** and make inquiry-only/payment limitations visible.
- Machine-readable `Organization`, `Person`, `WebPage`, `Service`, and visible FAQ answers must agree with the rendered public text. Do not add fictional reviews, sales, experience, locations, customers, contact verification, live statuses, or guarantees.
- The public site remains crawlable and in the sitemap; maintain the founder's search/reference-versus-training and licensing rules. Do not rewrite `robots.txt` to permit training by default.
- No schema markup guarantees search snippets, AI citations or rankings. Measure real discovery separately using supported webmaster tools.

## Acceptance and evidence
1. Run `node --test scripts/glass-scroll-seo.test.mjs` and `node scripts/verify-site.mjs` from the repository.
2. Check Chromium at 1440×900, 834×1112, 390×844 and iOS Safari, including reduced motion and a browser without blur support.
3. Inspect real page scroll: stars remain stationary while page content moves; glass readable with no overflow, broken anchors, tiny tap targets or console errors.
4. After authorized merge/deploy, verify the canonical Cloudflare Worker and public pages independently. A committed stylesheet, green static test, and a Worker deployment are distinct evidence categories.
5. Record exact branch/head, tests, results, remaining gaps, and rollback receipt. Roll back the shared CSS reference if the effect harms usability.

## Reuse in other apps
Port these invariant behaviors deliberately to each app's own repo and runtime. Do not quietly change FCR, Chief, SOL, PromptOS, Bip, or other independent applications from this repository.
