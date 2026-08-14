begin;
create schema if not exists ste_mondial;
create table if not exists ste_mondial.products (
  id bigserial primary key,
  name text not null,
  category text not null default 'unisexe',
  price numeric not null default 0,
  stock integer not null default 0,
  images jsonb default '[]'::jsonb,
  brand text default 'Ste Mondial',
  description text default '',
  created_at timestamptz default now()
);
create table if not exists ste_mondial.orders (
  id bigserial primary key,
  customer_name text not null default '',
  customer_phone text default '',
  customer_email text default '',
  shipping_address text default '',
  status text default 'pending',
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  user_id uuid,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table ste_mondial.products, ste_mondial.orders;
create or replace function ste_mondial.decrement_stock(p_id bigint, p_qty integer)
returns void language plpgsql as $$
begin
  update ste_mondial.products set stock = greatest(0, stock - p_qty) where id = p_id;
end;
$$;
commit;
