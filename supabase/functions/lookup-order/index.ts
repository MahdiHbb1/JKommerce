import { corsHeadersFor, parseAllowedOrigins } from '../_shared/cors.ts';
import { toPublicOrder, type OrderRowWithItems } from '../_shared/orderDto.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { createAdminClient, readAdminEnv } from '../_shared/supabaseAdmin.ts';

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX = 10;

const jsonResponse = (
  body: unknown,
  status: number,
  headers: Record<string, string>,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const candidate = forwarded
    ? forwarded.split(',')[0].trim()
    : (req.headers.get('x-real-ip') ?? '').trim();
  return candidate.length > 0 && candidate.length <= 64 ? candidate : 'unknown';
};

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(
    req.headers.get('origin'),
    parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS')),
  );

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, corsHeaders);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'invalid_request' }, 400, corsHeaders);
  }

  const input = body as Record<string, unknown>;
  const orderNumber =
    typeof input.order_number === 'string' ? input.order_number.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';

  if (
    orderNumber.length < 5 ||
    orderNumber.length > 40 ||
    email.length < 3 ||
    email.length > 254
  ) {
    return jsonResponse({ error: 'invalid_request' }, 400, corsHeaders);
  }

  const env = readAdminEnv();
  if (!env) {
    console.error('lookup-order: SUPABASE_URL/SERVICE_ROLE_KEY tidak tersedia');
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const supabase = createAdminClient(env);

  try {
    const allowed = await checkRateLimit(
      supabase,
      `rl:lookup-order:${getClientIp(req)}:${orderNumber}`,
      RATE_LIMIT_WINDOW_SECONDS,
      RATE_LIMIT_MAX,
    );
    if (!allowed) {
      return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
    }
  } catch (rateFailure) {
    console.error('lookup-order: rate limit gagal', rateFailure);
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'order_number, status, subtotal_idr, shipping_idr, discount_idr, tax_idr, total_idr, tax_mode, courier, tracking_number, created_at, paid_at, shipped_at, delivered_at, expires_at, email, order_items(name_snapshot, qty, unit_price_idr)',
    )
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) {
    console.error('lookup-order: query gagal', error);
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  if (!order) {
    return jsonResponse({ error: 'order_not_found' }, 404, corsHeaders);
  }

  const orderEmail =
    typeof order.email === 'string' ? order.email.trim().toLowerCase() : '';
  if (orderEmail === '' || orderEmail !== email.toLowerCase()) {
    return jsonResponse({ error: 'email_mismatch' }, 403, corsHeaders);
  }

  return jsonResponse(
    { order: toPublicOrder(order as OrderRowWithItems) },
    200,
    corsHeaders,
  );
});
