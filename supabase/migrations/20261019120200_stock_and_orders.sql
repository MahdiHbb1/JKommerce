-- Stock ledger and order RPCs. All writes go through security-definer functions;
-- clients never write orders or stock directly.

create sequence public.order_number_seq;

create table public.stock_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  kind text not null check (kind in ('reserve', 'release', 'sale', 'restock', 'adjust')),
  qty_delta integer not null,
  note text,
  actor text not null default 'system' check (actor in ('system', 'customer', 'admin')),
  created_at timestamptz not null default now()
);

create index stock_movements_variant_idx on public.stock_movements (variant_id, created_at desc);
create index stock_movements_order_idx on public.stock_movements (order_id);

create table public.idempotency_keys (
  key text primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);

create index idempotency_keys_expires_idx on public.idempotency_keys (expires_at);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1 check (count > 0),
  primary key (key, window_start)
);

create index rate_limits_window_idx on public.rate_limits (window_start);

alter table public.stock_movements enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table public.stock_movements from anon, authenticated;
revoke all on table public.idempotency_keys from anon, authenticated;
revoke all on table public.rate_limits from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;

-- Returns JK-YYYYMMDD-NNNN using the business timezone.
create or replace function public.generate_order_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'JK-'
    || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD')
    || '-'
    || lpad(nextval('public.order_number_seq')::text, 4, '0');
end;
$$;

-- Atomic fixed-window limiter. Returns false once the limit is exceeded.
create or replace function public.check_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_limit integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'invalid_rate_limit_key';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_limit is null or p_limit < 1 then
    raise exception 'invalid_rate_limit';
  end if;

  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Reserves stock for every item or raises insufficient_stock. The caller owns
-- the surrounding transaction, so a failure rolls back all partial reserves.
create or replace function public.reserve_order_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_items';
  end if;

  for v_item in
    select * from jsonb_to_recordset(p_items) as x(variant_id uuid, qty integer)
  loop
    if v_item.variant_id is null or v_item.qty is null or v_item.qty < 1 then
      raise exception 'invalid_items';
    end if;

    update public.product_variants
       set stock_reserved = stock_reserved + v_item.qty
     where id = v_item.variant_id
       and is_active
       and stock_on_hand - stock_reserved >= v_item.qty;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'insufficient_stock';
    end if;
  end loop;
end;
$$;

-- Releases reserved stock for a pending order and writes the ledger entries.
create or replace function public.release_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_item record;
  v_updated integer;
begin
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_status <> 'pending_payment' then
    raise exception 'invalid_status';
  end if;

  for v_item in
    select variant_id, qty
    from public.order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update public.product_variants
       set stock_reserved = greatest(0, stock_reserved - v_item.qty)
     where id = v_item.variant_id;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'stock_release_failed';
    end if;

    insert into public.stock_movements (variant_id, order_id, kind, qty_delta, actor, note)
    values (v_item.variant_id, p_order_id, 'release', -v_item.qty, 'system', 'order closed');
  end loop;
end;
$$;

-- Converts reserved stock into a sale. Called after a verified payment.
create or replace function public.commit_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_updated integer;
begin
  perform 1 from public.orders where id = p_order_id;
  if not found then
    raise exception 'order_not_found';
  end if;

  for v_item in
    select variant_id, qty
    from public.order_items
    where order_id = p_order_id and variant_id is not null
  loop
    update public.product_variants
       set stock_on_hand = stock_on_hand - v_item.qty,
           stock_reserved = stock_reserved - v_item.qty
     where id = v_item.variant_id
       and stock_on_hand >= v_item.qty
       and stock_reserved >= v_item.qty;

    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'stock_commit_failed';
    end if;

    insert into public.stock_movements (variant_id, order_id, kind, qty_delta, actor, note)
    values (v_item.variant_id, p_order_id, 'sale', -v_item.qty, 'system', 'payment verified');
  end loop;
end;
$$;

-- Creates an order once per idempotency key. Pricing and stock are validated
-- again here even though the Edge Function already computed them.
create or replace function public.create_order(
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.orders%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_user_id uuid;
  v_email text;
  v_customer jsonb;
  v_address jsonb;
  v_items jsonb;
  v_subtotal integer := 0;
  v_shipping integer;
  v_discount integer;
  v_tax integer;
  v_total integer;
  v_expected_total integer;
  v_tax_mode text;
  v_payment_preference text;
  v_note text;
  v_expires_at timestamptz;
  v_item record;
  v_product_id uuid;
  v_price integer;
begin
  if p_idempotency_key is null
     or char_length(p_idempotency_key) < 8
     or char_length(p_idempotency_key) > 80 then
    raise exception 'invalid_idempotency_key';
  end if;

  -- Serializes concurrent retries that share the same key.
  perform pg_advisory_xact_lock(hashtext('create_order:' || p_idempotency_key));

  select o.* into v_existing
  from public.orders o
  join public.idempotency_keys k on k.order_id = o.id
  where k.key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'id', v_existing.id,
      'order_number', v_existing.order_number,
      'status', v_existing.status,
      'subtotal_idr', v_existing.subtotal_idr,
      'shipping_idr', v_existing.shipping_idr,
      'discount_idr', v_existing.discount_idr,
      'tax_idr', v_existing.tax_idr,
      'total_idr', v_existing.total_idr,
      'tax_mode', v_existing.tax_mode,
      'expires_at', v_existing.expires_at
    );
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_payload';
  end if;

  v_items := p_payload -> 'items';
  if v_items is null
     or jsonb_typeof(v_items) <> 'array'
     or jsonb_array_length(v_items) = 0
     or jsonb_array_length(v_items) > 20 then
    raise exception 'invalid_items';
  end if;

  v_email := btrim(coalesce(p_payload ->> 'email', ''));
  if v_email = '' then
    raise exception 'invalid_email';
  end if;

  -- The Edge Function must take user_id from the verified JWT, not from the
  -- browser body; this function trusts only the service role caller.
  v_user_id := nullif(p_payload ->> 'user_id', '')::uuid;
  v_customer := coalesce(p_payload -> 'customer', '{}'::jsonb);
  v_address := coalesce(p_payload -> 'address', '{}'::jsonb);
  v_note := nullif(p_payload ->> 'note', '');
  v_shipping := nullif(p_payload ->> 'shipping_idr', '')::integer;
  v_discount := coalesce(nullif(p_payload ->> 'discount_idr', '')::integer, 0);
  v_tax := coalesce(nullif(p_payload ->> 'tax_idr', '')::integer, 0);
  v_tax_mode := coalesce(nullif(p_payload ->> 'tax_mode', ''), 'included');
  v_payment_preference := coalesce(nullif(p_payload ->> 'payment_preference', ''), 'manual');

  if v_shipping is null or v_shipping <= 0 then
    raise exception 'shipping_unavailable';
  end if;
  if v_discount < 0 or v_tax < 0 then
    raise exception 'invalid_totals';
  end if;
  if v_tax_mode not in ('included', 'excluded', 'none') then
    raise exception 'invalid_tax_mode';
  end if;
  if v_payment_preference not in ('manual', 'duitku') then
    raise exception 'invalid_payment_preference';
  end if;

  for v_item in
    select * from jsonb_to_recordset(v_items) as x(
      variant_id uuid,
      product_id uuid,
      qty integer,
      unit_price_idr integer,
      name_snapshot text,
      variant_snapshot jsonb
    )
  loop
    if v_item.variant_id is null
       or v_item.product_id is null
       or v_item.qty is null
       or v_item.qty < 1
       or v_item.qty > 10
       or v_item.unit_price_idr is null
       or v_item.unit_price_idr < 0 then
      raise exception 'invalid_items';
    end if;

    select pv.product_id, p.price_idr
      into v_product_id, v_price
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = v_item.variant_id
       and pv.is_active
       and p.is_active;

    if not found
       or v_product_id <> v_item.product_id
       or v_price <> v_item.unit_price_idr then
      raise exception 'invalid_items';
    end if;

    v_subtotal := v_subtotal + (v_item.qty * v_item.unit_price_idr);
  end loop;

  v_total := nullif(p_payload ->> 'total_idr', '')::integer;
  v_expected_total := v_subtotal + v_shipping - v_discount
    + case when v_tax_mode = 'excluded' then v_tax else 0 end;

  if v_total is null or v_total <> v_expected_total then
    raise exception 'invalid_totals';
  end if;

  perform public.reserve_order_stock(v_items);

  v_expires_at := now() + interval '24 hours';
  v_order_number := public.generate_order_number();

  insert into public.orders (
    order_number, user_id, email, customer, address,
    subtotal_idr, shipping_idr, discount_idr, tax_idr, total_idr,
    tax_mode, payment_preference, status, note, expires_at
  ) values (
    v_order_number, v_user_id, v_email, v_customer, v_address,
    v_subtotal, v_shipping, v_discount, v_tax, v_total,
    v_tax_mode, v_payment_preference, 'pending_payment', v_note, v_expires_at
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, variant_id, name_snapshot, variant_snapshot,
    qty, unit_price_idr, line_total_idr
  )
  select
    v_order_id,
    (it ->> 'product_id')::uuid,
    (it ->> 'variant_id')::uuid,
    coalesce(nullif(it ->> 'name_snapshot', ''), 'Produk'),
    coalesce(it -> 'variant_snapshot', '{}'::jsonb),
    (it ->> 'qty')::integer,
    (it ->> 'unit_price_idr')::integer,
    (it ->> 'qty')::integer * (it ->> 'unit_price_idr')::integer
  from jsonb_array_elements(v_items) as it;

  insert into public.stock_movements (variant_id, order_id, kind, qty_delta, actor, note)
  select
    (it ->> 'variant_id')::uuid,
    v_order_id,
    'reserve',
    (it ->> 'qty')::integer,
    'system',
    'order created'
  from jsonb_array_elements(v_items) as it;

  insert into public.order_events (order_id, event, from_status, to_status, actor, metadata)
  values (
    v_order_id, 'created', null, 'pending_payment', 'system',
    jsonb_build_object('order_number', v_order_number)
  );

  insert into public.idempotency_keys (key, order_id)
  values (p_idempotency_key, v_order_id);

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending_payment',
    'subtotal_idr', v_subtotal,
    'shipping_idr', v_shipping,
    'discount_idr', v_discount,
    'tax_idr', v_tax,
    'total_idr', v_total,
    'tax_mode', v_tax_mode,
    'expires_at', v_expires_at
  );
end;
$$;

-- Public cancellation: order number + email, rate-limited, no order enumeration.
create or replace function public.cancel_order_by_customer(
  p_order_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_order_number is null or p_email is null or btrim(p_email) = '' then
    raise exception 'order_not_found';
  end if;

  if not public.check_rate_limit('cancel:' || lower(btrim(p_email)), 600, 10) then
    raise exception 'rate_limited';
  end if;

  select * into v_order
  from public.orders
  where order_number = btrim(p_order_number)
    and lower(email) = lower(btrim(p_email))
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'invalid_status';
  end if;

  perform public.release_order_stock(v_order.id);

  update public.orders
     set status = 'cancelled', cancelled_at = now(), updated_at = now()
   where id = v_order.id;

  insert into public.order_events (order_id, event, from_status, to_status, actor, metadata)
  values (
    v_order.id, 'cancelled', 'pending_payment', 'cancelled', 'customer',
    jsonb_build_object('channel', 'customer')
  );

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'status', 'cancelled'
  );
end;
$$;

-- Cron target: expires unpaid orders and releases their stock.
create or replace function public.expire_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_count integer := 0;
begin
  for v_order in
    select id from public.orders
    where status = 'pending_payment' and expires_at <= now()
    for update skip locked
  loop
    perform public.release_order_stock(v_order.id);

    update public.orders
       set status = 'expired', updated_at = now()
     where id = v_order.id;

    insert into public.order_events (order_id, event, from_status, to_status, actor)
    values (v_order.id, 'expired', 'pending_payment', 'expired', 'system');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.generate_order_number() from public;
grant execute on function public.generate_order_number() to service_role;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

revoke all on function public.reserve_order_stock(jsonb) from public;
grant execute on function public.reserve_order_stock(jsonb) to service_role;

revoke all on function public.release_order_stock(uuid) from public;
grant execute on function public.release_order_stock(uuid) to service_role;

revoke all on function public.commit_order_stock(uuid) from public;
grant execute on function public.commit_order_stock(uuid) to service_role;

revoke all on function public.create_order(jsonb, text) from public;
grant execute on function public.create_order(jsonb, text) to service_role;

revoke all on function public.cancel_order_by_customer(text, text) from public;
grant execute on function public.cancel_order_by_customer(text, text) to anon, authenticated;

revoke all on function public.expire_pending_orders() from public;
grant execute on function public.expire_pending_orders() to service_role;
