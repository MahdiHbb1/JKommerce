-- Catalog: products, variants, settings, shipping zones, public settings view.
-- Adds the product/variant foreign keys deferred from core.sql.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_en text,
  category text not null,
  pattern text,
  description text,
  heritage text,
  details text,
  price_idr integer not null check (price_idr > 0),
  weight_grams integer not null default 0 check (weight_grams >= 0),
  images text[] not null default '{}'::text[],
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  needs_verification boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_active_idx on public.products (is_active) where is_active;
create index products_feed_idx on public.products (is_featured, is_bestseller) where is_active;

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size text not null,
  color text not null,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  stock_reserved integer not null default 0 check (stock_reserved >= 0 and stock_reserved <= stock_on_hand),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color)
);

create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_stock_idx on public.product_variants (product_id) where is_active;

alter table public.order_items
  add constraint order_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete set null,
  add constraint order_items_variant_id_fkey
    foreign key (variant_id) references public.product_variants(id) on delete set null;

alter table public.cart_items
  add constraint cart_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade,
  add constraint cart_items_variant_id_fkey
    foreign key (variant_id) references public.product_variants(id) on delete cascade;

alter table public.wishlist_items
  add constraint wishlist_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;

create table public.site_settings (
  id integer primary key check (id = 1),
  business jsonb not null default '{}'::jsonb,
  tax jsonb not null default '{"mode":"included","rate_percent":11}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  legal jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rate_idr integer not null check (rate_idr > 0),
  eta_min_days integer not null default 1 check (eta_min_days >= 0),
  eta_max_days integer not null default 3 check (eta_max_days >= eta_min_days),
  provinces text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_zones_active_idx on public.shipping_zones (is_active) where is_active;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create trigger shipping_zones_set_updated_at
  before update on public.shipping_zones
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.site_settings enable row level security;
alter table public.shipping_zones enable row level security;

create policy products_select_public on public.products
  for select to anon, authenticated
  using (is_active);

create policy products_admin_all on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy product_variants_select_public on public.product_variants
  for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_variants_admin_all on public.product_variants
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy site_settings_admin_all on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy shipping_zones_select_public on public.shipping_zones
  for select to anon, authenticated
  using (is_active);

create policy shipping_zones_admin_all on public.shipping_zones
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create view public.public_settings as
  select business, tax, payment, legal
  from public.site_settings
  where id = 1;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

revoke all on table public.product_variants from anon, authenticated;
grant select on table public.product_variants to anon, authenticated;
grant insert, update, delete on table public.product_variants to authenticated;

revoke all on table public.site_settings from anon, authenticated;
grant select, insert, update, delete on table public.site_settings to authenticated;

revoke all on table public.shipping_zones from anon, authenticated;
grant select on table public.shipping_zones to anon, authenticated;
grant insert, update, delete on table public.shipping_zones to authenticated;

revoke all on table public.public_settings from anon, authenticated;
grant select on table public.public_settings to anon, authenticated;
