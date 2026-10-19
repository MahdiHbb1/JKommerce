-- Core: orders, order items/events, cart, wishlist, admin helper, updated_at trigger.
-- Fresh project: replaces the legacy demo migrations (no production data to preserve).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  customer jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  subtotal_idr integer not null default 0 check (subtotal_idr >= 0),
  shipping_idr integer not null default 0 check (shipping_idr >= 0),
  discount_idr integer not null default 0 check (discount_idr >= 0),
  tax_idr integer not null default 0 check (tax_idr >= 0),
  total_idr integer not null default 0 check (total_idr >= 0),
  tax_mode text not null default 'included' check (tax_mode in ('included', 'excluded', 'none')),
  payment_preference text not null default 'manual' check (payment_preference in ('manual', 'duitku')),
  status text not null default 'pending_payment' check (
    status in (
      'pending_payment', 'expired', 'cancelled', 'paid',
      'packing', 'shipped', 'delivered', 'refunded'
    )
  ),
  courier text,
  tracking_number text,
  note text,
  internal_note text,
  expires_at timestamptz not null default now() + interval '24 hours',
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_email_idx on public.orders (lower(email));
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_pending_expiry_idx on public.orders (expires_at)
  where status = 'pending_payment';

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  name_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb,
  qty integer not null check (qty > 0),
  unit_price_idr integer not null check (unit_price_idr >= 0),
  line_total_idr integer not null check (line_total_idr >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event text not null,
  from_status text,
  to_status text,
  actor text not null default 'system' check (actor in ('system', 'customer', 'admin')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id, created_at desc);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null,
  variant_id uuid,
  quantity integer not null default 1 check (quantity > 0),
  selected_size text,
  selected_color text,
  cart_item_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, cart_item_id)
);

create index cart_items_user_id_idx on public.cart_items (user_id);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null,
  product_data jsonb not null default '{}'::jsonb,
  added_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlist_items_user_id_idx on public.wishlist_items (user_id);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;

create policy orders_select_own_or_admin on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy order_items_select_own_or_admin on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy order_events_select_own_or_admin on public.order_events
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy cart_items_select_own on public.cart_items
  for select to authenticated using (user_id = auth.uid());
create policy cart_items_insert_own on public.cart_items
  for insert to authenticated with check (user_id = auth.uid());
create policy cart_items_update_own on public.cart_items
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_delete_own on public.cart_items
  for delete to authenticated using (user_id = auth.uid());

create policy wishlist_items_select_own on public.wishlist_items
  for select to authenticated using (user_id = auth.uid());
create policy wishlist_items_insert_own on public.wishlist_items
  for insert to authenticated with check (user_id = auth.uid());
create policy wishlist_items_delete_own on public.wishlist_items
  for delete to authenticated using (user_id = auth.uid());

revoke all on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;

revoke all on table public.order_items from anon, authenticated;
grant select on table public.order_items to authenticated;

revoke all on table public.order_events from anon, authenticated;
grant select on table public.order_events to authenticated;

revoke all on table public.cart_items from anon, authenticated;
grant select, insert, update, delete on table public.cart_items to authenticated;

revoke all on table public.wishlist_items from anon, authenticated;
grant select, insert, delete on table public.wishlist_items to authenticated;

revoke all on function public.set_updated_at() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
