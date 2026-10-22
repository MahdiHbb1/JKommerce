-- Scheduled maintenance. pg_cron is available on Supabase; the job runs as the
-- extension owner and calls the security-definer expiry function.
create extension if not exists pg_cron;

select cron.schedule(
  'expire-pending-orders',
  '*/15 * * * *',
  $$select public.expire_pending_orders();$$
);
