import { createClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env');
} catch {
  // Env bisa datang dari shell.
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

const createOrderUrl =
  process.env.E2E_CREATE_ORDER_URL ??
  (supabaseUrl ? `${supabaseUrl}/functions/v1/create-order` : '');
const lookupOrderUrl =
  process.env.E2E_LOOKUP_ORDER_URL ??
  (supabaseUrl ? `${supabaseUrl}/functions/v1/lookup-order` : '');

if (!supabaseUrl || !anonKey || !createOrderUrl || !lookupOrderUrl) {
  console.error(
    'Butuh VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env ' +
      '(atau E2E_CREATE_ORDER_URL / E2E_LOOKUP_ORDER_URL untuk function lokal).',
  );
  process.exit(1);
}

let serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!serviceKey) {
  if (!accessToken) {
    console.error(
      'Butuh SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_ACCESS_TOKEN untuk cleanup.',
    );
    process.exit(1);
  }

  const projectRef = new URL(supabaseUrl).host.split('.')[0];
  const keyResponse = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!keyResponse.ok) {
    console.error(`Gagal mengambil service key: HTTP ${keyResponse.status}`);
    process.exit(1);
  }
  const keys = await keyResponse.json();
  serviceKey = keys.find(
    (entry) => entry.name === 'service_role' && entry.api_key,
  )?.api_key;
  if (!serviceKey) {
    console.error('service_role key tidak ditemukan pada project.');
    process.exit(1);
  }
}

const service = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const fakeIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`;

let passed = 0;
const assert = (condition, label) => {
  if (!condition) {
    throw new Error(label);
  }
  passed += 1;
  console.log(`PASS ${label}`);
};

const call = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      'x-forwarded-for': fakeIp,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Biarkan null; assertion pesan status akan menjelaskan.
  }
  return { status: response.status, headers: response.headers, json };
};

const stockAvailable = (variant) =>
  Math.max(0, Number(variant.stock_on_hand) - Number(variant.stock_reserved));

const productOf = (variant) =>
  Array.isArray(variant.products) ? variant.products[0] : variant.products;

const getReserved = async (ids) => {
  const { data, error } = await service
    .from('product_variants')
    .select('id, stock_reserved')
    .in('id', ids);
  if (error) {
    throw new Error(`Gagal membaca stok: ${error.message}`);
  }
  return Object.fromEntries(data.map((row) => [row.id, row.stock_reserved]));
};

let orderId = null;
let createdZoneId = null;

const cleanup = async () => {
  const currentOrderId = orderId;
  orderId = null;

  if (currentOrderId) {
    const { error: releaseError } = await service.rpc('release_order_stock', {
      p_order_id: currentOrderId,
    });
    if (releaseError && !releaseError.message.includes('order_not_found')) {
      console.warn(`cleanup: release stok gagal (${releaseError.message})`);
    }

    await service.from('stock_movements').delete().eq('order_id', currentOrderId);
    const { error: deleteError } = await service
      .from('orders')
      .delete()
      .eq('id', currentOrderId);
    if (deleteError) {
      console.warn(`cleanup: hapus order gagal (${deleteError.message})`);
    }
  }

  if (createdZoneId) {
    await service.from('shipping_zones').delete().eq('id', createdZoneId);
    createdZoneId = null;
  }

  await service
    .from('rate_limits')
    .delete()
    .eq('key', `rl:create-order:${fakeIp}`);
  await service
    .from('rate_limits')
    .delete()
    .like('key', `rl:lookup-order:${fakeIp}:%`);
};

let failed = false;

try {
  // CORS fail-closed.
  const foreignPreflight = await fetch(createOrderUrl, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://evil.example',
      'access-control-request-method': 'POST',
    },
  });
  assert(foreignPreflight.status === 204, 'preflight OPTIONS mengembalikan 204');
  assert(
    foreignPreflight.headers.get('access-control-allow-origin') === null,
    'origin asing tidak mendapat header allow',
  );

  const localPreflight = await fetch(createOrderUrl, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost:5173',
      'access-control-request-method': 'POST',
    },
  });
  assert(
    localPreflight.headers.get('access-control-allow-origin') ===
      'http://localhost:5173',
    'origin localhost:5173 diizinkan',
  );

  const { data: zones, error: zonesError } = await service
    .from('shipping_zones')
    .select('id, name, rate_idr, provinces')
    .eq('is_active', true);
  if (zonesError) {
    throw new Error(`Gagal membaca zona ongkir: ${zonesError.message}`);
  }

  let zone = (zones ?? []).find(
    (candidate) =>
      Array.isArray(candidate.provinces) && candidate.provinces.length > 0,
  );
  if (!zone) {
    const { data: inserted, error: insertError } = await service
      .from('shipping_zones')
      .insert({
        name: 'Zona Uji E2E',
        rate_idr: 20_000,
        eta_min_days: 2,
        eta_max_days: 4,
        provinces: ['DI Yogyakarta'],
        is_active: true,
      })
      .select('id, name, rate_idr, provinces')
      .single();
    if (insertError) {
      throw new Error(`Gagal membuat zona uji: ${insertError.message}`);
    }
    zone = inserted;
    createdZoneId = inserted.id;
  }
  const province = zone.provinces[0];

  const { data: settings } = await service
    .from('site_settings')
    .select('tax')
    .eq('id', 1)
    .maybeSingle();
  const taxMode = settings?.tax?.mode ?? 'included';

  const { data: variants, error: variantsError } = await service
    .from('product_variants')
    .select(
      'id, sku, size, color, stock_on_hand, stock_reserved, is_active, products(name, price_idr, is_active)',
    )
    .eq('is_active', true)
    .limit(50);
  if (variantsError) {
    throw new Error(`Gagal membaca varian: ${variantsError.message}`);
  }

  const activeVariants = (variants ?? []).filter(
    (variant) =>
      variant.is_active !== false && productOf(variant)?.is_active !== false,
  );
  const variantA = activeVariants.find((variant) => stockAvailable(variant) >= 1);
  const variantB = activeVariants.find(
    (variant) => variant.id !== variantA?.id && stockAvailable(variant) >= 2,
  );
  const oversellVariant = activeVariants.find(
    (variant) => stockAvailable(variant) < 10,
  );

  if (!variantA || !variantB || !oversellVariant) {
    throw new Error(
      'Butuh dua varian aktif (stok >= 1 dan >= 2) serta satu varian stok < 10. Jalankan seed dulu.',
    );
  }

  const before = await getReserved([variantA.id, variantB.id]);

  const stamp = Date.now();
  const email = `e2e+${stamp}@example.test`;
  const idempotencyKey = `e2e-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
  const payload = {
    items: [
      { variant_id: variantA.id, qty: 1 },
      { variant_id: variantB.id, qty: 2 },
    ],
    customer: { name: 'Uji E2E', email, phone: '081234567890' },
    address: {
      recipient: 'Uji E2E',
      phone: '081234567890',
      full_address: 'Jl. Pengujian No. 1, Yogyakarta',
      city: 'Yogyakarta',
      province,
      postal_code: '55271',
      country: 'ID',
      note: 'Pesanan uji otomatis',
    },
    payment_preference: 'manual',
    accepts: {
      tos: true,
      privacy: true,
      versions: { tos: '2026-10-01', privacy: '2026-10-01' },
    },
    idempotency_key: idempotencyKey,
  };

  const created = await call(createOrderUrl, payload);
  assert(created.status === 200, `create-order 200 (dapat ${created.status})`);
  const order = created.json;
  assert(Boolean(order), 'respons berisi order');
  assert(
    /^JK-\d{8}-\d{4}$/.test(order?.order_number ?? ''),
    `nomor pesanan JK-YYYYMMDD-NNNN (${order?.order_number})`,
  );
  assert(order?.status === 'pending_payment', 'status awal pending_payment');
  assert(
    Number.isInteger(order?.totals?.total_idr) && order.totals.total_idr > 0,
    'total integer > 0',
  );
  assert(
    order?.totals?.shipping_idr === zone.rate_idr,
    `ongkir sesuai zona (${zone.rate_idr})`,
  );
  assert(
    order?.totals?.tax_mode === taxMode,
    `mode pajak dari site_settings (${taxMode})`,
  );

  const { data: dbOrder, error: dbOrderError } = await service
    .from('orders')
    .select('id, status, email')
    .eq('order_number', order.order_number)
    .maybeSingle();
  if (dbOrderError) {
    throw new Error(`Gagal membaca order: ${dbOrderError.message}`);
  }
  orderId = dbOrder?.id ?? null;
  assert(
    Boolean(orderId) && dbOrder.status === 'pending_payment',
    'order tersimpan di DB',
  );

  const reservedAfter = await getReserved([variantA.id, variantB.id]);
  assert(
    reservedAfter[variantA.id] === before[variantA.id] + 1,
    'stok reserved varian A naik 1',
  );
  assert(
    reservedAfter[variantB.id] === before[variantB.id] + 2,
    'stok reserved varian B naik 2',
  );

  const duplicate = await call(createOrderUrl, payload);
  assert(
    duplicate.status === 200 &&
      duplicate.json?.order_number === order.order_number,
    'dobel submit idempotency sama mengembalikan order yang sama',
  );

  const { count, error: countError } = await service
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('email', email);
  if (countError) {
    throw new Error(`Gagal menghitung order: ${countError.message}`);
  }
  assert(count === 1, 'hanya satu order untuk idempotency key tersebut');

  const reservedAfterDuplicate = await getReserved([variantA.id, variantB.id]);
  assert(
    reservedAfterDuplicate[variantA.id] === reservedAfter[variantA.id] &&
      reservedAfterDuplicate[variantB.id] === reservedAfter[variantB.id],
    'dobel submit tidak menambah reservasi stok',
  );

  const oversellQty = stockAvailable(oversellVariant) + 1;
  const oversell = await call(createOrderUrl, {
    ...payload,
    items: [{ variant_id: oversellVariant.id, qty: oversellQty }],
    customer: {
      ...payload.customer,
      email: `oversell+${stamp}@example.test`,
    },
    idempotency_key: `e2e-oversell-${stamp}`,
  });
  assert(
    oversell.status === 409,
    `qty melebihi stok ditolak 409 (dapat ${oversell.status})`,
  );
  assert(
    oversell.json?.error === 'insufficient_stock',
    'error insufficient_stock',
  );

  const wrongEmail = await call(lookupOrderUrl, {
    order_number: order.order_number,
    email: `salah+${stamp}@example.test`,
  });
  assert(
    wrongEmail.status === 403,
    `lookup dengan email salah ditolak 403 (dapat ${wrongEmail.status})`,
  );
  assert(wrongEmail.json?.error === 'email_mismatch', 'error email_mismatch');

  const lookup = await call(lookupOrderUrl, {
    order_number: order.order_number,
    email,
  });
  assert(lookup.status === 200, `lookup email benar 200 (dapat ${lookup.status})`);
  const dto = lookup.json?.order;
  assert(Boolean(dto), 'lookup mengembalikan order');
  assert(
    ['id', 'user_id', 'email', 'internal_note', 'payload', 'customer', 'address'].every(
      (key) => !(key in dto),
    ),
    'lookup tidak membocorkan field internal',
  );
  assert(dto.items?.length === 2, 'lookup memuat 2 item');
  assert(
    dto.items.every(
      (item) =>
        Object.keys(item).sort().join(',') ===
        'name,qty,unit_price_idr',
    ),
    'item hanya memuat nama/qty/harga',
  );
  assert(
    Object.keys(dto.totals ?? {}).sort().join(',') ===
      'discount_idr,shipping_idr,subtotal_idr,tax_idr,tax_mode,total_idr',
    'totals sesuai DTO',
  );

  await cleanup();
  const restored = await getReserved([variantA.id, variantB.id]);
  assert(
    restored[variantA.id] === before[variantA.id] &&
      restored[variantB.id] === before[variantB.id],
    'reservasi stok kembali seperti semula setelah cleanup',
  );
} catch (error) {
  failed = true;
  console.error(`E2E FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await cleanup();
}

if (!failed) {
  console.log(`\nE2E OK — ${passed} assertion PASS`);
}
