import { Client } from 'pg';

try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional when the variables are already exported in the shell.
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    'SUPABASE_DB_URL belum diset. Lihat docs/runbook/00-supabase-setup.md.',
  );
  process.exit(1);
}

const admin = new Client({ connectionString });
const raceClients = [];
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    console.log(`PASS ${name}`);
    return;
  }
  failures.push(name);
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
}

async function anonQuery(sql, params = []) {
  await admin.query('begin');
  try {
    await admin.query('set local role anon');
    const result = await admin.query(sql, params);
    await admin.query('rollback');
    return { ok: true, result };
  } catch (error) {
    await admin.query('rollback').catch(() => {});
    return { ok: false, error };
  }
}

let productId = null;
let variantId = null;
let testEmail = null;

try {
  await admin.connect();
  await admin.query('select 1');

  const expectedTables = [
    'orders',
    'order_items',
    'order_events',
    'products',
    'product_variants',
    'site_settings',
    'public_settings',
    'shipping_zones',
    'stock_movements',
    'idempotency_keys',
    'rate_limits',
    'cart_items',
    'wishlist_items',
  ];
  const { rows: tableRows } = await admin.query(
    `select relname as tablename
       from pg_class
      where relnamespace = 'public'::regnamespace
        and relkind in ('r', 'v', 'p')`,
  );
  const tables = new Set(tableRows.map((row) => row.tablename));
  const missingTables = expectedTables.filter((table) => !tables.has(table));
  check('semua tabel inti ada', missingTables.length === 0, missingTables.join(', '));

  const rlsTables = [
    'orders',
    'order_items',
    'order_events',
    'products',
    'product_variants',
    'site_settings',
    'shipping_zones',
    'stock_movements',
    'idempotency_keys',
    'rate_limits',
    'cart_items',
    'wishlist_items',
  ];
  const { rows: rlsRows } = await admin.query(
    `select relname, relrowsecurity
       from pg_class
      where relnamespace = 'public'::regnamespace
        and relname = any($1::text[])`,
    [rlsTables],
  );
  const rls = new Map(rlsRows.map((row) => [row.relname, row.relrowsecurity]));
  const rlsOff = rlsTables.filter((table) => rls.get(table) !== true);
  check('RLS aktif di semua tabel sensitif', rlsOff.length === 0, rlsOff.join(', '));

  const expectedFunctions = [
    'generate_order_number',
    'check_rate_limit',
    'reserve_order_stock',
    'release_order_stock',
    'commit_order_stock',
    'create_order',
    'cancel_order_by_customer',
    'expire_pending_orders',
  ];
  const { rows: functionRows } = await admin.query(
    `select p.proname
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = any($1::text[])`,
    [expectedFunctions],
  );
  const functions = new Set(functionRows.map((row) => row.proname));
  const missingFunctions = expectedFunctions.filter((fn) => !functions.has(fn));
  check('semua RPC inti ada', missingFunctions.length === 0, missingFunctions.join(', '));

  const allFunctions = [
    ...expectedFunctions,
    'is_admin',
    'set_updated_at',
  ];
  const { rows: privilegeRows } = await admin.query(
    `select p.proname,
            has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec,
            has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = any($1::text[])`,
    [allFunctions],
  );
  const privileges = new Map(
    privilegeRows.map((row) => [row.proname, row]),
  );
  const serviceOnly = [
    'generate_order_number',
    'check_rate_limit',
    'reserve_order_stock',
    'release_order_stock',
    'commit_order_stock',
    'create_order',
    'expire_pending_orders',
    'set_updated_at',
  ];
  const leakedFunctions = serviceOnly.filter(
    (fn) => privileges.get(fn)?.anon_exec || privileges.get(fn)?.auth_exec,
  );
  check(
    'RPC internal tidak dapat dieksekusi anon/authenticated',
    leakedFunctions.length === 0,
    leakedFunctions.join(', '),
  );
  check(
    'cancel_order_by_customer dapat dipanggil anon & authenticated',
    privileges.get('cancel_order_by_customer')?.anon_exec === true &&
      privileges.get('cancel_order_by_customer')?.auth_exec === true,
  );

  const { rows: tablePrivilegeRows } = await admin.query(
    `select
       has_table_privilege('anon', 'public.orders', 'INSERT') as anon_orders_insert,
       has_table_privilege('anon', 'public.orders', 'SELECT') as anon_orders_select,
       has_table_privilege('anon', 'public.site_settings', 'SELECT') as anon_settings_select,
       has_table_privilege('authenticated', 'public.orders', 'INSERT') as auth_orders_insert,
       has_table_privilege('authenticated', 'public.orders', 'UPDATE') as auth_orders_update,
       has_table_privilege('authenticated', 'public.orders', 'DELETE') as auth_orders_delete,
       has_sequence_privilege('authenticated', 'public.order_number_seq', 'USAGE') as auth_order_seq_usage`,
  );
  const tablePrivileges = tablePrivilegeRows[0];
  check(
    'anon tidak punya privilege langsung orders/site_settings',
    tablePrivileges.anon_orders_insert === false &&
      tablePrivileges.anon_orders_select === false &&
      tablePrivileges.anon_settings_select === false,
  );
  check(
    'authenticated tidak bisa menulis orders langsung',
    tablePrivileges.auth_orders_insert === false &&
      tablePrivileges.auth_orders_update === false &&
      tablePrivileges.auth_orders_delete === false,
  );
  check(
    'authenticated tidak bisa memakai sequence nomor pesanan',
    tablePrivileges.auth_order_seq_usage === false,
  );

  const publicSettings = await anonQuery(
    'select business, tax, payment, legal from public.public_settings',
  );
  check(
    'anon bisa membaca public_settings',
    publicSettings.ok && publicSettings.result.rows.length === 1,
    publicSettings.error?.message,
  );
  const tax = publicSettings.ok ? publicSettings.result.rows[0]?.tax : null;
  check(
    'default pajak included 11%',
    tax?.mode === 'included' && Number(tax?.rate_percent) === 11,
    JSON.stringify(tax),
  );

  const anonOrders = await anonQuery('select id from public.orders limit 1');
  check('anon ditolak select orders', !anonOrders.ok);

  const anonInsert = await anonQuery(
    `insert into public.orders (order_number, email, expires_at)
     values ('JK-TEST-ANON', 'anon@example.test', now())`,
  );
  check('anon ditolak insert orders', !anonInsert.ok);

  const anonSettings = await anonQuery('select id from public.site_settings');
  check('anon ditolak select site_settings', !anonSettings.ok);

  const cron = await admin
    .query("select jobname from cron.job where jobname = 'expire-pending-orders'")
    .catch((error) => ({ rows: [], error }));
  check(
    'cron expire-pending-orders terjadwal',
    cron.rows.length === 1,
    cron.error?.message,
  );

  const suffix = Date.now().toString(36);
  testEmail = `race-${suffix}@example.test`;

  const { rows: productRows } = await admin.query(
    `insert into public.products (slug, name, category, price_idr, is_active, needs_verification)
     values ($1, $2, 'Test', 100000, true, true)
     returning id`,
    [`test-race-${suffix}`, 'Produk Uji Stok'],
  );
  productId = productRows[0].id;

  const { rows: variantRows } = await admin.query(
    `insert into public.product_variants
       (product_id, sku, size, color, stock_on_hand, stock_reserved, is_active)
     values ($1, $2, 'M', 'Hitam', 1, 0, true)
     returning id`,
    [productId, `TEST-${suffix}`],
  );
  variantId = variantRows[0].id;

  const payload = {
    email: testEmail,
    customer: { name: 'Pembeli Uji' },
    address: { province: 'DKI Jakarta', city: 'Jakarta' },
    items: [
      {
        variant_id: variantId,
        product_id: productId,
        qty: 1,
        unit_price_idr: 100000,
        name_snapshot: 'Produk Uji Stok',
        variant_snapshot: { size: 'M', color: 'Hitam' },
      },
    ],
    shipping_idr: 20000,
    discount_idr: 0,
    tax_idr: 0,
    tax_mode: 'none',
    total_idr: 120000,
    payment_preference: 'manual',
  };

  const keyA = `race-${suffix}-a`;
  const keyB = `race-${suffix}-b`;
  const clientA = new Client({ connectionString });
  const clientB = new Client({ connectionString });
  raceClients.push(clientA, clientB);
  await clientA.connect();
  await clientB.connect();

  const calls = [
    { client: clientA, key: keyA },
    { client: clientB, key: keyB },
  ];
  const results = await Promise.allSettled(
    calls.map((call) =>
      call.client.query('select public.create_order($1::jsonb, $2) as result', [
        JSON.stringify(payload),
        call.key,
      ]),
    ),
  );

  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.find((result) => result.status === 'rejected');
  check('race stok: tepat satu pesanan dibuat', fulfilled.length === 1);
  check(
    'race stok: satu gagal insufficient_stock',
    Boolean(rejected) &&
      /insufficient_stock/.test(String(rejected.reason?.message ?? '')),
    rejected?.reason?.message,
  );

  let order = null;
  let successKey = null;
  if (fulfilled.length === 1) {
    const index = results.findIndex((result) => result.status === 'fulfilled');
    successKey = calls[index].key;
    order = fulfilled[0].value.rows[0].result;
  }

  if (order) {
    const { rows: stockRows } = await admin.query(
      'select stock_reserved from public.product_variants where id = $1',
      [variantId],
    );
    check('stok tereservasi setelah order', stockRows[0]?.stock_reserved === 1);

    const replay = await admin.query(
      'select public.create_order($1::jsonb, $2) as result',
      [JSON.stringify(payload), successKey],
    );
    check(
      'idempotency mengembalikan pesanan yang sama',
      replay.rows[0]?.result?.order_number === order.order_number,
    );

    const { rows: stockAfterReplay } = await admin.query(
      'select stock_reserved from public.product_variants where id = $1',
      [variantId],
    );
    check(
      'idempotency tidak menambah reservasi',
      stockAfterReplay[0]?.stock_reserved === 1,
    );

    const wrongCancel = await admin
      .query('select public.cancel_order_by_customer($1, $2)', [
        order.order_number,
        `salah-${testEmail}`,
      ])
      .then(() => true)
      .catch(() => false);
    check('batal dengan email salah ditolak', !wrongCancel);

    const cancelled = await admin.query(
      'select public.cancel_order_by_customer($1, $2) as result',
      [order.order_number, testEmail],
    );
    check(
      'batal dengan email benar -> cancelled',
      cancelled.rows[0]?.result?.status === 'cancelled',
    );

    const { rows: stockReleased } = await admin.query(
      'select stock_reserved from public.product_variants where id = $1',
      [variantId],
    );
    check('reservasi stok kembali 0 setelah batal', stockReleased[0]?.stock_reserved === 0);

    const { rows: cancelEvents } = await admin.query(
      `select event, to_status from public.order_events
        where order_id = $1 and event = 'cancelled'`,
      [order.id],
    );
    check(
      'event pembatalan tercatat',
      cancelEvents.length === 1 && cancelEvents[0].to_status === 'cancelled',
    );
  }
} catch (error) {
  failures.push('fatal');
  console.error('DB FAIL:', error.message);
} finally {
  for (const client of raceClients) {
    await client.end().catch(() => {});
  }

  if (admin) {
    if (variantId) {
      await admin
        .query('delete from public.stock_movements where variant_id = $1', [variantId])
        .catch(() => {});
    }
    if (testEmail) {
      await admin
        .query('delete from public.orders where email = $1', [testEmail])
        .catch(() => {});
    }
    if (variantId) {
      await admin
        .query('delete from public.product_variants where id = $1', [variantId])
        .catch(() => {});
    }
    if (productId) {
      await admin
        .query('delete from public.products where id = $1', [productId])
        .catch(() => {});
    }
    await admin.end().catch(() => {});
  }
}

if (failures.length > 0) {
  console.error(`DB FAIL: ${failures.length} assertion gagal`);
  process.exitCode = 1;
} else {
  console.log('DB OK');
}
