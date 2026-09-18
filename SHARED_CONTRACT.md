# STE MONDIAL — SHARED CONTRACT (all subagents read this first)
Written: 2026-09-08. User is AWAY for the day. Full autonomy granted. Do not ask questions; decide and document.

## PROJECT
Turn new-mock.html (static mockup, LIVE at https://ste-mondial-web.vercel.app/new-mock.html) into a fully functional trilingual e-commerce shop. Mobile-first. Replace the old ste-copy.html as the real shop when done.

## SUPABASE (project: ste-mondial)
- URL: https://xuwumbdyfywmxuzlvvul.supabase.co
- REF: xuwumbdyfywmxuzlvvul
- Publishable (anon/frontend) key: sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_
- DB password: read C:/Users/USER/Desktop/hermes-can-use/ste-mondial-db-pw.txt (NEVER put any password in URLs on command lines; build SUPABASE_DB_URL inside Python from the file, or write .pgpass)
- PROTECTED: TypeShii (dtwciuhwwanwlwpydeko). NEVER touch. No other Supabase project may be modified.
- CLI: C:/Users/USER/AppData/Roaming/npm/supabase.cmd (token via Credential Manager). .cmd shims reject /c/ paths — use C:/ paths. db pw inline is HARD-BLOCKED: use SUPABASE_DB_URL env var or .pgpass.

## SCHEMA (sql/schema.sql — Lane 1 creates; others read, never edit)
Tables (public schema): products(id uuid pk default gen_random_uuid(), sku text unique, name_fr/name_en/name_ar text not null, desc_fr/desc_en/desc_ar text, category text not null check in ('inspires','voiture','ambiance','musc','accessoires'), price numeric(10,3) not null, old_price numeric(10,3), image_url text, images jsonb default '[]', stock int default 0, rating numeric(2,1) default 5.0, review_count int default 0, featured boolean default false, active boolean default true, created_at timestamptz default now())
orders(id uuid pk, user_id uuid null fk→auth.users on delete set null, customer_name text, customer_phone text not null, customer_email text, address text, city text, notes text, items jsonb not null, total numeric(10,3) not null, status text default 'nouvelle' check in ('nouvelle','confirmee','expediee','livree','annulee'), created_at timestamptz default now())
site_settings(key text pk, value jsonb) — live keys: shop_name, whatsapp, default_language, delivery_fee (num, flat fee — always applied, free-shipping rule removed 2026-09), hero_image (legacy single), hero_images (jsonb array, >1 = slider), hero_autoplay (bool, default true), banner_image (promo section), logo_image (header+footer), announcement_fr/en/ar
RLS: products/site_settings SELECT public; ALL writes admin only (is_admin() = admin email in JWT). orders: INSERT public with check (user_id is null or = auth.uid()), SELECT admin OR owner (user_id = auth.uid()), UPDATE/DELETE admin only. profiles table: authenticated SELECT/INSERT/UPDATE own rows (auth.uid() = id) only.
Realtime: enable on products + orders.
Seed: ~8 products across the 4 categories (Oud Wood, J'adore, Bleu de Chanel, Bois de Santal @ 49.900 DT + 4 more), image_url empty or generic picsum URLs (user: generic images OK, do NOT waste time cropping).

## I18N (the i18n/JSON contract — lanes coding UI copy MUST use these keys)
Languages: fr (default), en, ar (dir=rtl for ar). Keys are nested per section: nav.*, utility.*, hero.*, categories.*, products.*, product.*, cart.*, checkout.*, orders.*, footer.*, admin.*, misc.*
Lang files: i18n/fr.json, i18n/en.json, i18n/ar.json — flat JSON, same key set in all 3. Product names/descriptions come from DB columns (name_fr/name_en/name_ar), NOT i18n files.
Arabic: NO Arabic font face allowed (user ban). font stack ends with sans-serif; system renders Arabic.

## FRONTEND (Lane 2 — build from existing new-mock.html + css/new.css)
- File: index2.html + css/index2.css + js/app2.js (NEW files; do not edit ste-copy.html / index.html / css/index.css / css/ste-copy.css / css/new.css).
- Reuse css/new.css design tokens/layout as the starting point, extend to mobile-first (base styles = 390px, scale UP via min-width media queries at 480/768/1024).
- Fix viewport: html,body{max-width:100%;overflow-x:clip} + no fixed-width children; test 320/360/390/768/1440.
- Pages/views (SPA, hash routing or view divs): Shop (hero/categories/best sellers/grid+tabs by category), Product detail (modal or view), Cart drawer, Checkout form (name, phone required, email optional, address, city, notes → INSERT into orders via anon key), Order confirmation (order id shown, "paiement à la livraison").
- Cart: localStorage; badge count; quantity +/-; remove.
- Language switcher: FR/EN/AR buttons in header + mobile menu; sets <html lang> + dir=rtl for ar; persists localStorage; swaps ALL text via i18n JSONs fetched at boot.
- Fonts: Montserrat only (family=Montserrat:wght@100;200;300;400;500&display=swap). NO other families.
- Products: load from Supabase REST (select * from products where active order by featured desc, created_at desc); fallback: if fetch fails show 4 static mockup products so page never looks broken.
- Palette: espresso #2B1D12, cream #F5F0E6, gold #B08D4A, olive #3A4A2E.

## ADMIN (Lane 3 — admin2.html + css/admin2.css + js/admin2.js, NEW files only)
- Route: /admin2.html. Auth: Supabase Auth (email/password). Admin account: azmmeli146@gmail.com / password in C:/Users/USER/Desktop/hermes-can-use/ste-mondial-admin-login.txt (Lane 1 creates this user via Admin API auth.admin using service access or SQL insert into auth.users — NEVER expose the password in the UI or logs).
- Views: Dashboard (today orders count, revenue, pending), Orders (list, filter by status, change status via dropdown → UPDATE, view customer details), Products (CRUD: add/edit/delete, set featured/active/stock/price per language fields), Settings (site_settings key/value editor).
- Admin UI language: FR. Same Montserrat font. Espresso/gold theme.
- If Supabase Auth is blocked for the admin user creation, fallback: admin login checks credentials against an auth.users row created via SQL; document which method was used in REPORT.

## IMAGES
- Generic only: use https://picsum.photos/seed/<slug>/800/800 for products, 1600/900 for hero. Do NOT crop mockup screenshots. Do NOT spend time generating images.

## DEPLOY (parent only — lanes never deploy)
- cd C:/Users/USER/Desktop/hermes-can-use/ste-mondial-deploy2 && "$APPDATA/npm/vercel.cmd" deploy --prod --yes
- Live alias: https://ste-mondial-web.vercel.app — final URLs: /index2.html, /admin2.html

## VERIFICATION STANDARD (every lane)
- Lane 1: every table present via REST (curl with anon key), RLS enforced (anon write to products FAILS, order insert SUCCEEDS), admin user exists.
- Lane 2: headless Chrome (E:/tools/chrome-win64/chrome.exe, playwright via E:/hermes/bin/uv.exe run --no-project --with playwright python) at 390px + 1440px: no horizontal overflow at any width, cart add→checkout→order INSERTS into Supabase (verify by reading orders via REST after), lang switch to AR renders RTL, zero console errors.
- Lane 3: headless Chrome: login works, order status change persists (verify via REST), product create/edit/delete works end-to-end.

## REPORT FORMAT
Each lane: numbered steps STARTED→DONE/FAILED with one-line evidence, files created, decisions taken, anything the parent must do.
