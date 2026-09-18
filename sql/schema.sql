-- ============================================================================
-- STE MONDIAL — Supabase schema (Lane 1 / Database)
-- Per SHARED_CONTRACT.md — project ref: xuwumbdyfywmxuzlvvul
-- Idempotent: safe to re-run.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default extensions.gen_random_uuid(),
  sku          text unique,
  name_fr      text not null,
  name_en      text not null,
  name_ar      text not null,
  desc_fr      text,
  desc_en      text,
  desc_ar      text,
  price        numeric(10,3) not null,
  old_price    numeric(10,3),
  image_url    text,
  images       jsonb default '[]'::jsonb,
  stock        int default 0,
  rating       numeric(2,1) default 5.0,
  review_count int default 0,
  featured     boolean default false,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default extensions.gen_random_uuid(),
  customer_name  text,
  customer_phone text not null,
  customer_email text,
  address        text,
  city           text,
  notes          text,
  items          jsonb not null,
  total          numeric(10,3) not null,
  status         text default 'nouvelle' check (status in ('nouvelle','confirmee','expediee','livree','annulee')),
  created_at     timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key   text primary key,
  value jsonb
);

-- ---------------------------------------------------------------------------
-- helper: is_admin() — authenticated session whose JWT email == admin email
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'azmmeli146@gmail.com'
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.site_settings enable row level security;

-- products: public read (active rows for everyone; admin also sees inactive),
--           writes only for the authenticated admin (service_role bypasses RLS).
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (active or public.is_admin());

drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- orders: public INSERT (checkout); SELECT/UPDATE/DELETE admin only.
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public"
  on public.orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders_delete_admin" on public.orders;
create policy "orders_delete_admin"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- site_settings: public read, admin writes.
drop policy if exists "settings_select_public" on public.site_settings;
create policy "settings_select_public"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "settings_insert_admin" on public.site_settings;
create policy "settings_insert_admin"
  on public.site_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "settings_update_admin" on public.site_settings;
create policy "settings_update_admin"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "settings_delete_admin" on public.site_settings;
create policy "settings_delete_admin"
  on public.site_settings for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- realtime: products + orders in supabase_realtime publication
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;

alter table public.products replica identity full;
alter table public.orders   replica identity full;

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index if not exists products_listing_idx  on public.products (active, featured, created_at desc);
create index if not exists orders_status_idx     on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- privileges (Supabase defaults — actual access governed by RLS above)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
