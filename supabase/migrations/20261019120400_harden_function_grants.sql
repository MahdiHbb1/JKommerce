-- Supabase grants EXECUTE on new public functions to anon/authenticated via
-- default privileges. Internal stock/order RPCs must not be reachable from the
-- browser, even though they are SECURITY DEFINER.

revoke all on function public.generate_order_number() from public, anon, authenticated;
grant execute on function public.generate_order_number() to service_role;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

revoke all on function public.reserve_order_stock(jsonb) from public, anon, authenticated;
grant execute on function public.reserve_order_stock(jsonb) to service_role;

revoke all on function public.release_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.release_order_stock(uuid) to service_role;

revoke all on function public.commit_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.commit_order_stock(uuid) to service_role;

revoke all on function public.create_order(jsonb, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, text) to service_role;

revoke all on function public.expire_pending_orders() from public, anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;

-- Public cancellation intentionally stays callable from the storefront.
revoke all on function public.cancel_order_by_customer(text, text) from public, anon, authenticated;
grant execute on function public.cancel_order_by_customer(text, text) to anon, authenticated;

-- Policies only need is_admin() for authenticated users.
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
