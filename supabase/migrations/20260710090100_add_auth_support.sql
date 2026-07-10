-- Add user_id column to orders table for proper RLS
alter table public.orders add column if not exists user_id uuid references auth.users(id);

-- Create index for faster lookups
create index if not exists orders_user_id_idx on public.orders (user_id);

-- Enable RLS if not already enabled
alter table public.orders enable row level security;

-- Drop existing policies
drop policy if exists "Allow insert guest orders" on public.orders;

-- Create new policies with proper auth support
-- Users can read their own orders
create policy "Users can read own orders" on public.orders
for select
using (auth.uid() = user_id);

-- Users can insert their own orders
create policy "Users can insert own orders" on public.orders
for insert
with check (auth.uid() = user_id);

-- Users can update their own orders
create policy "Users can update own orders" on public.orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow anonymous inserts for guest checkout (will be migrated to user_id on login)
create policy "Allow anonymous guest orders" on public.orders
for insert
with check (auth.uid() is null);
