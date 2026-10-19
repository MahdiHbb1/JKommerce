import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  configured: true,
  calls: [],
  results: {},
  supabase: { from: vi.fn() },
}));

vi.mock('../../supabaseClient.js', () => ({
  get supabase() {
    return mocks.supabase;
  },
  get isSupabaseConfigured() {
    return mocks.configured;
  },
}));

function builderFor(table) {
  const result = mocks.results[table] ?? { data: [], error: null };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((column, value) => {
      mocks.calls.push({ table, op: 'eq', column, value });
      return builder;
    }),
    order: vi.fn((...args) => {
      mocks.calls.push({ table, op: 'order', args });
      return builder;
    }),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

import {
  fetchProductBySlug,
  fetchProducts,
  fetchPublicSettings,
  fetchShippingZones,
} from '../catalog.js';

const productRow = {
  id: 'p1',
  slug: 'batik-tulis-parang',
  name: 'Batik Tulis Parang',
  name_en: null,
  category: 'Batik Tulis',
  pattern: 'Parang',
  description: 'Deskripsi',
  heritage: 'Warisan',
  details: 'Detail',
  price_idr: 1850000,
  images: ['parang.jpg'],
  is_active: true,
  is_featured: true,
  is_bestseller: false,
  needs_verification: true,
  sort_order: 1,
  product_variants: [
    {
      id: 'v1',
      sku: 'SKU-1',
      size: 'M',
      color: 'Navy Blue',
      stock_on_hand: 5,
      stock_reserved: 2,
      is_active: true,
    },
    {
      id: 'v2',
      sku: 'SKU-2',
      size: 'L',
      color: 'Navy Blue',
      stock_on_hand: 1,
      stock_reserved: 1,
      is_active: true,
    },
  ],
};

beforeEach(() => {
  mocks.configured = true;
  mocks.calls = [];
  mocks.results = {};
  mocks.supabase.from.mockReset();
  mocks.supabase.from.mockImplementation((table) => builderFor(table));
});

describe('fetchProducts', () => {
  it('memfilter produk aktif dan memetakan stock_available', async () => {
    mocks.results.products = { data: [productRow], error: null };

    const products = await fetchProducts();

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: 'p1',
      slug: 'batik-tulis-parang',
      price_idr: 1850000,
      is_featured: true,
      is_bestseller: false,
      needs_verification: true,
    });
    expect(products[0].variants[0]).toMatchObject({
      id: 'v1',
      sku: 'SKU-1',
      size: 'M',
      color: 'Navy Blue',
      stock_available: 3,
    });
    expect(products[0].variants[1].stock_available).toBe(0);
    expect(mocks.calls).toContainEqual({
      table: 'products',
      op: 'eq',
      column: 'is_active',
      value: true,
    });
  });

  it('tidak memfilter is_active saat includeInactive=true', async () => {
    mocks.results.products = { data: [productRow], error: null };

    await fetchProducts({ includeInactive: true });

    expect(
      mocks.calls.find((call) => call.op === 'eq' && call.column === 'is_active'),
    ).toBeUndefined();
  });

  it('melempar error yang jelas saat query gagal', async () => {
    mocks.results.products = { data: null, error: { message: 'boom' } };

    await expect(fetchProducts()).rejects.toThrow('Gagal memuat katalog: boom');
  });
});

describe('fetchProductBySlug', () => {
  it('mengembalikan produk dengan varian', async () => {
    mocks.results.products = { data: productRow, error: null };

    const product = await fetchProductBySlug('batik-tulis-parang');

    expect(product.slug).toBe('batik-tulis-parang');
    expect(product.variants).toHaveLength(2);
    expect(mocks.calls).toContainEqual({
      table: 'products',
      op: 'eq',
      column: 'slug',
      value: 'batik-tulis-parang',
    });
  });

  it('mengembalikan null bila produk tidak ada', async () => {
    mocks.results.products = { data: null, error: null };

    await expect(fetchProductBySlug('tidak-ada')).resolves.toBeNull();
  });

  it('melempar error saat query gagal', async () => {
    mocks.results.products = { data: null, error: { message: 'rusak' } };

    await expect(fetchProductBySlug('apa-saja')).rejects.toThrow(
      'Gagal memuat produk: rusak',
    );
  });
});

describe('fetchPublicSettings', () => {
  it('mengembalikan business/tax/payment/legal', async () => {
    mocks.results.public_settings = {
      data: {
        business: { name: 'Janoer Koening' },
        tax: { mode: 'included', rate_percent: 11 },
        payment: {},
        legal: {},
      },
      error: null,
    };

    const settings = await fetchPublicSettings();

    expect(settings.tax.mode).toBe('included');
    expect(settings.business.name).toBe('Janoer Koening');
  });

  it('melempar error bila baris settings belum ada', async () => {
    mocks.results.public_settings = { data: null, error: null };

    await expect(fetchPublicSettings()).rejects.toThrow(
      'Pengaturan toko belum tersedia',
    );
  });
});

describe('fetchShippingZones', () => {
  it('hanya mengambil zona aktif', async () => {
    mocks.results.shipping_zones = {
      data: [
        {
          id: 'z1',
          name: 'Jabodetabek',
          rate_idr: 15000,
          eta_min_days: 1,
          eta_max_days: 2,
          provinces: ['DKI Jakarta'],
          is_active: true,
        },
      ],
      error: null,
    };

    const zones = await fetchShippingZones();

    expect(zones).toHaveLength(1);
    expect(zones[0].rate_idr).toBe(15000);
    expect(mocks.calls).toContainEqual({
      table: 'shipping_zones',
      op: 'eq',
      column: 'is_active',
      value: true,
    });
  });

  it('melempar error saat query gagal', async () => {
    mocks.results.shipping_zones = { data: null, error: { message: 'gagal' } };

    await expect(fetchShippingZones()).rejects.toThrow(
      'Gagal memuat zona ongkir: gagal',
    );
  });
});

describe('supabase belum dikonfigurasi', () => {
  beforeEach(() => {
    mocks.configured = false;
  });

  it.each([
    ['fetchProducts', () => fetchProducts()],
    ['fetchProductBySlug', () => fetchProductBySlug('apa-saja')],
    ['fetchPublicSettings', () => fetchPublicSettings()],
    ['fetchShippingZones', () => fetchShippingZones()],
  ])('%s melempar pesan konfigurasi', async (_name, call) => {
    await expect(call()).rejects.toThrow('Supabase belum dikonfigurasi');
  });
});
