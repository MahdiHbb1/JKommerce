import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeadersFor, parseAllowedOrigins } from '../_shared/cors.ts';
import { computeTotals, type TaxMode } from '../_shared/pricing.ts';
import { checkRateLimit } from '../_shared/ratelimit.ts';
import { createAdminClient, readAdminEnv } from '../_shared/supabaseAdmin.ts';
import { validateCreateOrder } from '../_shared/validate.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/**
 * user_id hanya boleh berasal dari JWT yang sudah diverifikasi platform.
 * Token anon bukan pengguna; getUser() memastikan tanda tangan token.
 */
const resolveUserId = async (
  supabase: SupabaseClient,
  req: Request,
  anonKey: string | null,
): Promise<string | null> => {
  const header = req.headers.get('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = header.slice(7).trim();
  if (!token || (anonKey && token === anonKey)) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    return null;
  }

  return data.user.id;
};

const mapRpcError = (message: string): { status: number; error: string } => {
  if (message.includes('insufficient_stock')) {
    return { status: 409, error: 'insufficient_stock' };
  }
  if (message.includes('shipping_unavailable')) {
    return { status: 400, error: 'shipping_unavailable' };
  }
  if (
    [
      'invalid_items',
      'invalid_totals',
      'invalid_payload',
      'invalid_email',
      'invalid_tax_mode',
      'invalid_payment_preference',
      'invalid_idempotency_key',
    ].some((code) => message.includes(code))
  ) {
    return { status: 400, error: 'invalid_order' };
  }
  return { status: 500, error: 'internal_error' };
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

  const validation = validateCreateOrder(body);
  if (!validation.ok) {
    return jsonResponse(
      { error: 'validation_failed', errors: validation.errors },
      400,
      corsHeaders,
    );
  }
  const input = validation.value;

  const env = readAdminEnv();
  if (!env) {
    console.error('create-order: SUPABASE_URL/SERVICE_ROLE_KEY tidak tersedia');
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const supabase = createAdminClient(env);

  const variantIds = [...new Set(input.items.map((item) => item.variant_id))];
  if (variantIds.some((id) => !UUID_PATTERN.test(id))) {
    return jsonResponse({ error: 'invalid_items' }, 400, corsHeaders);
  }

  // Rate limit berdasarkan IP; key tetap pendek dan tidak memuat PII.
  try {
    const allowed = await checkRateLimit(
      supabase,
      `rl:create-order:${getClientIp(req)}`,
      RATE_LIMIT_WINDOW_SECONDS,
      RATE_LIMIT_MAX,
    );
    if (!allowed) {
      return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
    }
  } catch (rateFailure) {
    console.error('create-order: rate limit gagal', rateFailure);
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const [settingsResult, zonesResult, variantsResult] = await Promise.all([
    supabase.from('site_settings').select('tax').eq('id', 1).maybeSingle(),
    supabase
      .from('shipping_zones')
      .select('id, name, rate_idr, provinces')
      .eq('is_active', true),
    supabase
      .from('product_variants')
      .select(
        'id, product_id, sku, size, color, is_active, products(name, price_idr, is_active)',
      )
      .in('id', variantIds),
  ]);

  if (settingsResult.error || zonesResult.error || variantsResult.error) {
    console.error(
      'create-order: gagal membaca konfigurasi',
      settingsResult.error ?? zonesResult.error ?? variantsResult.error,
    );
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const tax = settingsResult.data?.tax as
    | { mode?: string; rate_percent?: number }
    | undefined;
  if (
    !tax ||
    (tax.mode !== 'included' && tax.mode !== 'excluded' && tax.mode !== 'none') ||
    typeof tax.rate_percent !== 'number' ||
    !Number.isFinite(tax.rate_percent) ||
    tax.rate_percent < 0 ||
    tax.rate_percent > 100
  ) {
    console.error('create-order: site_settings.tax tidak valid');
    return jsonResponse({ error: 'settings_unavailable' }, 500, corsHeaders);
  }

  const normalize = (value: string) => value.trim().toLowerCase();
  const zone = (zonesResult.data ?? []).find(
    (candidate) =>
      Array.isArray(candidate.provinces) &&
      candidate.provinces.some(
        (province: unknown) =>
          typeof province === 'string' &&
          normalize(province) === normalize(input.address.province),
      ),
  );

  if (!zone || !Number.isInteger(zone.rate_idr) || zone.rate_idr <= 0) {
    return jsonResponse({ error: 'shipping_unavailable' }, 400, corsHeaders);
  }

  const variantMap = new Map(
    (variantsResult.data ?? []).map((variant) => [variant.id, variant]),
  );

  const lines: { qty: number; unit_price_idr: number }[] = [];
  const rpcItems: Record<string, unknown>[] = [];

  for (const item of input.items) {
    const variant = variantMap.get(item.variant_id);
    const product = variant
      ? Array.isArray(variant.products)
        ? variant.products[0]
        : variant.products
      : null;

    if (
      !variant ||
      variant.is_active === false ||
      !product ||
      product.is_active === false ||
      !Number.isInteger(product.price_idr) ||
      product.price_idr < 0
    ) {
      return jsonResponse({ error: 'invalid_items' }, 400, corsHeaders);
    }

    lines.push({ qty: item.qty, unit_price_idr: product.price_idr });
    rpcItems.push({
      variant_id: variant.id,
      product_id: variant.product_id,
      qty: item.qty,
      unit_price_idr: product.price_idr,
      name_snapshot: product.name,
      variant_snapshot: {
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
      },
    });
  }

  let totals;
  try {
    totals = computeTotals({
      lines,
      shipping_idr: zone.rate_idr,
      discount_idr: 0,
      tax: { mode: tax.mode as TaxMode, rate_percent: tax.rate_percent },
    });
  } catch (totalsFailure) {
    console.error('create-order: computeTotals gagal', totalsFailure);
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const userId = await resolveUserId(supabase, req, env.anonKey);
  const payload = {
    items: rpcItems,
    email: input.customer.email,
    user_id: userId,
    customer: input.customer,
    address: input.address,
    note: input.address.note ?? null,
    shipping_idr: totals.shipping_idr,
    discount_idr: totals.discount_idr,
    tax_idr: totals.tax_idr,
    tax_mode: tax.mode,
    total_idr: totals.total_idr,
    payment_preference: input.payment_preference,
  };

  const { data: created, error: rpcError } = await supabase.rpc('create_order', {
    p_payload: payload,
    p_idempotency_key: input.idempotency_key,
  });

  if (rpcError) {
    const mapped = mapRpcError(String(rpcError.message ?? ''));
    if (mapped.status >= 500) {
      console.error('create-order: RPC gagal', rpcError);
    }
    return jsonResponse({ error: mapped.error }, mapped.status, corsHeaders);
  }

  if (!created) {
    console.error('create-order: RPC tidak mengembalikan order');
    return jsonResponse({ error: 'internal_error' }, 500, corsHeaders);
  }

  const result = created as Record<string, unknown>;
  return jsonResponse(
    {
      order_number: result.order_number,
      status: result.status,
      totals: {
        subtotal_idr: result.subtotal_idr,
        shipping_idr: result.shipping_idr,
        discount_idr: result.discount_idr,
        tax_idr: result.tax_idr,
        total_idr: result.total_idr,
        tax_mode: result.tax_mode,
      },
      expires_at: result.expires_at,
    },
    200,
    corsHeaders,
  );
});
