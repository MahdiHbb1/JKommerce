import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

const PRODUCT_SELECT = '*, product_variants(*)';

function assertConfigured() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase belum dikonfigurasi');
  }
}

function mapVariant(row) {
  const onHand = Number(row?.stock_on_hand ?? 0);
  const reserved = Number(row?.stock_reserved ?? 0);
  return {
    id: row.id,
    sku: row.sku,
    size: row.size,
    color: row.color,
    is_active: row.is_active !== false,
    stock_available: Math.max(0, onHand - reserved),
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    name_en: row.name_en ?? null,
    category: row.category,
    pattern: row.pattern ?? null,
    description: row.description ?? null,
    heritage: row.heritage ?? null,
    details: row.details ?? null,
    price_idr: row.price_idr,
    images: Array.isArray(row.images) ? row.images : [],
    is_featured: Boolean(row.is_featured),
    is_bestseller: Boolean(row.is_bestseller),
    needs_verification: Boolean(row.needs_verification),
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at ?? null,
    variants: Array.isArray(row.product_variants)
      ? row.product_variants.map(mapVariant)
      : [],
  };
}

export async function fetchProducts({ includeInactive = false } = {}) {
  assertConfigured();

  let query = supabase.from('products').select(PRODUCT_SELECT);
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat katalog: ${error.message}`);
  }
  return (data ?? []).map(mapProduct);
}

export async function fetchProductBySlug(slug) {
  assertConfigured();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat produk: ${error.message}`);
  }
  return data ? mapProduct(data) : null;
}

export async function fetchPublicSettings() {
  assertConfigured();

  const { data, error } = await supabase
    .from('public_settings')
    .select('business, tax, payment, legal')
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat pengaturan toko: ${error.message}`);
  }
  if (!data) {
    throw new Error('Pengaturan toko belum tersedia');
  }
  return data;
}

export async function fetchShippingZones() {
  assertConfigured();

  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('is_active', true)
    .order('rate_idr', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat zona ongkir: ${error.message}`);
  }
  return data ?? [];
}
