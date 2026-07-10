create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  email text not null,
  status text not null default 'processing',
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "Allow read own guest orders" on public.orders
for select
using (true);

create policy "Allow insert guest orders" on public.orders
for insert
with check (true);

create policy "Allow update guest orders" on public.orders
for update
using (true)
with check (true);