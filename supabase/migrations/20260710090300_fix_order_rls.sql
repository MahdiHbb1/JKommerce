-- Drop dangerous policies that expose all order data
-- These policies used `using (true)` which allowed anyone with anon key to read/update ALL orders

drop policy if exists "Allow read own guest orders" on public.orders;
drop policy if exists "Allow update guest orders" on public.orders;

-- Keep insert policy for guest checkout, but consider rate limiting at Edge Function level if needed
-- Read access is now handled by the lookup-order Edge Function with service role key
