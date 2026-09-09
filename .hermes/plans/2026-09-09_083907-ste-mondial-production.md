# STE MONDIAL — Production Finish Plan

**Date:** 2026-09-09 · **Status:** DRAFT — awaiting user edits
**Goal:** Turn ste-mondial-deploy2 into the real production STE Mondial shop: curated home, well-crafted admin, real images, hardened checkout, clean DB, deployed to https://ste-mondial-web.vercel.app.

## HARD RULES
- **NEVER launch Chrome / playwright / scrapling** (user order — PC freeze risk). All verification via: `node --check`, urllib fetches, Supabase REST probes, static i18n key checks. Final visual pass = user's phone.
- Touch ONLY v2 files (index2.html, admin2.html, css/index2.css, css/admin2.css, js/app2.js, js/admin2.js, i18n/*, i/*, sql/*, vercel.json, robots.txt, sitemap.xml). Legacy files (ste-copy, index.html v1, product.html, css/index.css, css/product.css) stay frozen.
- Keys never on command lines. Anon order inserts use `.select()`-free pattern (RETURNING=42501). Test orders cleaned up via service key after each verify.
- Deploy ONCE at the very end (`vercel deploy --prod --yes`). Commit after every phase.

## CURRENT STATE (audited 2026-09-09)
- LIVE: index2.html (FR/EN/AR SPA) + admin2.html on ste-mondial-web.vercel.app
- DB live: products/orders/site_settings, RLS + realtime ON, 8 products seeded — **all images are picsum placeholders**
- Real assets ALREADY EXIST in i/new/: hero.jpg, p1–p4.jpg (the 4 featured perfumes), banner1.jpg + logo/favicons in i/
- i18n complete (fr/en/ar.json); Montserrat only; no Arabic face (per user ban)
- Git: **entire v2 build is UNCOMMITTED** (last commit a18c790) — baseline risk
- Missing: vercel.json, og/social meta, robots.txt, sitemap, 404 page, delivery-fee rule, admin dashboard stats, real product copy polish

## DECISIONS (LOCKED 2026-09-09 with user)
1. **Images for the 4 non-featured products** — USER DECISION: build WITHOUT photos. Elegant brand-styled placeholder (gradient + bottle glyph / product initial, no broken-img look). When the friend brings real photos, we swap them in later (Task 1.1 becomes trivial PATCH update). The 4 featured products KEEP their real crops (p1–p4.jpg).
2. **Delivery fee below 80 DT:** 8.000 DT flat, free ≥ 80 DT (locked default, no objection).
3. **Product detail:** keep polished modal (locked default).
4. **Domain:** stay on ste-mondial-web.vercel.app (locked default).
5. **Home page edits:** I run full curation pass (Phase 2), user critiques after on phone.

## PHASE 0 — Safety baseline (~10 min)
- Task 0.1: `git add -A && git commit -m "baseline: v2 shop + admin before production pass"` — protects everything.
- Task 0.2: Move junk to `_legacy/`: `_lane3_login_390.png`, `rosa.css`, `new-mock.html`, `css/new.css` (keep for reference, out of deploy path). Verify deploy still fine (these were live URLs — add vercel.json redirects only if user cares).
- Verify: `git log --oneline -2`, `ls`.

## PHASE 1 — Data & real images (~40 min)
- Task 1.1: Get 4 remaining product images (per Decision 1) → `i/products/<sku>.jpg`, ~800×800, quality 82.
- Task 1.2: UPDATE all 8 products' image_url via Supabase REST (service key, PATCH) → real local paths (`i/new/p1.jpg` ×4 + `i/products/…` ×4). Verify each URL returns 200 via urllib.
- Task 1.3: DB hardening SQL (apply via SUPABASE_DB_URL psql): index `orders(created_at desc)`, `products(active, featured)`; verify seed prices/format; site_settings defaults (delivery_fee=8, free_threshold=80, whatsapp/phone/socials if user provides).
- Task 1.4: Commit.

## PHASE 2 — Home page curation (the big one, ~2h)
- Task 2.1: Kill every picsum reference in js/app2.js (4 refs) — DB-driven image_url with styled gradient fallback via onerror.
- Task 2.2: Hero: real hero.jpg + curated FR/EN/AR copy; check headline contrast, CTA actions scroll to grid.
- Task 2.3: Copy pass all 3 languages: real product names/descriptions (via DB columns), category blurbs, trust bar, footer links all point somewhere real (no dead #).
- Task 2.4: Price formatting: `49,900 DT` fr / `49.900 DT` en / RTL-safe ar. Old-price strike + promo badge when old_price set.
- Task 2.5: Product modal polish: image, desc, qty stepper, stock badge ("rupture" when stock=0, button disabled), reviews stars from rating/review_count.
- Task 2.6: Search: wire the header search icon to a client-side filter of the product grid (cheap, useful). Cart drawer polish: qty +/-, remove, subtotal, delivery fee line (rule from Decision 2).
- Task 2.7: RTL/ar static check: verify every t() key has ar.json entry + dir=rtl branch in code paths (script, no browser).
- Verify: `node --check js/app2.js`; i18n key-coverage script (scan data-i18n + t('…') vs the 3 JSONs, must be 100%); urllib fetch index2.html → 200; commit.

## PHASE 3 — Checkout hardening (~1h)
- Task 3.1: Tunisian phone validation (8 digits, ^[2459]\d{7}$ after stripping spaces/+216), inline errors localized in 3 JSONs.
- Task 3.2: Required-field UX (name, phone, address, city), email optional; submit spinner; duplicate-submit guard.
- Task 3.3: Confirmation view: order ref (short id), "paiement à la livraison", total recap, delivery rule line.
- Task 3.4: REST end-to-end probe: insert test order (anon, no .select()) → verify via service-key GET → DELETE test row.
- Verify + commit.

## PHASE 4 — Admin craft (~1.5h)
- Task 4.1: Dashboard: cards — orders today, revenue today, pending (nouvelle+confirmee), low-stock products; latest 5 orders list.
- Task 4.2: Orders view: status pipeline dropdown (nouvelle→confirmée→expédiée→livrée / annulée), customer detail drawer with `tel:` link, date + total formatting, status filter tabs with counts.
- Task 4.3: Products view: image preview thumb, inline price/stock edit, featured/active toggles, add/edit modal with 3-language fields + validation, delete confirm.
- Task 4.4: Settings view: key/value editor for delivery fee, thresholds, contact info.
- Verify: `node --check js/admin2.js`; auth probe: POST /auth/v1/token with admin creds from ste-mondial-admin-login.txt → 200; status-change probe via authenticated REST → verify persisted; commit.

## PHASE 5 — Production hardening + deploy (~45 min)
- Task 5.1: vercel.json: cache headers for i/* (long), clean 404 → 404.html, security headers (X-Content-Type-Options, Referrer-Policy).
- Task 5.2: SEO: og/twitter meta + canonical on index2.html, robots.txt, sitemap.xml, favicon links confirmed present.
- Task 5.3: Perf: preload hero image, `loading="lazy"` on non-hero imgs, font display=swap already on.
- Task 5.4: 404.html (brand-styled, FR with EN/AR switch, link home).
- Task 5.5: **DEPLOY ONCE**: `vercel deploy --prod --yes`.
- Task 5.6: Post-deploy urllib verification: /, /index2.html, /admin2.html, /robots.txt, /sitemap.xml, /404.html → 200; og tags present; every DB image_url + page asset URL → 200; final REST smoke (products list 8 active; test order insert+cleanup).
- Task 5.7: Final commit + tag `v1.0-production`.

## PHASE 6 — Handoff
- Deliver to user: live URLs, admin creds location, what to test on their phone (order flow in all 3 languages), known limits (COD only, no email receipts).
