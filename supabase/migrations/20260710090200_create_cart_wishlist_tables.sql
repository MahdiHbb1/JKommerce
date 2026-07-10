-- Create cart table for user-specific cart items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id integer not null,
  quantity integer not null default 1,
  selected_size text,
  selected_color text,
  cart_item_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, cart_item_id)
);

-- Create wishlist table for user-specific wishlist items
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id integer not null,
  product_data jsonb not null,
  added_at timestamptz not null default now(),
  unique(user_id, product_id)
);

-- Enable RLS
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;

-- RLS policies for cart_items
create policy "Users can read own cart items" on public.cart_items
for select
using (auth.uid() = user_id);

create policy "Users can insert own cart items" on public.cart_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update own cart items" on public.cart_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own cart items" on public.cart_items
for delete
using (auth.uid() = user_id);

-- RLS policies for wishlist_items
create policy "Users can read own wishlist items" on public.wishlist_items
for select
using (auth.uid() = user_id);

create policy "Users can insert own wishlist items" on public.wishlist_items
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own wishlist items" on public.wishlist_items
for delete
using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists wishlist_items_user_id_idx on public.wishlist_items(user_id);
