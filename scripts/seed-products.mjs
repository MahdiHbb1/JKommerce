import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env');
} catch {
  // Env vars bisa juga datang dari shell.
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const seedPath = path.join(scriptDir, 'seed', 'products.seed.json');
const imageDir = path.join(repoRoot, 'src', 'assets', 'images');

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Butuh SUPABASE_URL (atau VITE_SUPABASE_URL) dan SUPABASE_SERVICE_ROLE_KEY di .env.\n' +
      'Lihat docs/runbook/00-supabase-setup.md bagian kunci service role.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'product-images';
const STORAGE_PREFIX = 'products';
const PLACEHOLDER_STOCK = 3;
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function uploadImage(filename) {
  const storagePath = `${STORAGE_PREFIX}/${filename}`;
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(STORAGE_PREFIX, { search: filename, limit: 1 });
  if (existing?.some((entry) => entry.name === filename)) {
    return { status: 'skipped' };
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    throw new Error(`Tipe gambar tidak didukung: ${filename}`);
  }

  let bytes;
  try {
    bytes = await readFile(path.join(imageDir, filename));
  } catch {
    throw new Error(`File gambar tidak ditemukan: ${filename}`);
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType, upsert: true });
  if (error) {
    throw new Error(`Upload ${filename} gagal: ${error.message}`);
  }
  return { status: 'uploaded' };
}

function makeSku(slug, size, color) {
  return `JK-${slug}-${size}-${color}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, 'utf8'));
  const products = seed.products;
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error('products.seed.json tidak berisi produk.');
  }

  const imageFiles = [
    ...new Set(products.flatMap((product) => product.images ?? [])),
  ];
  const imageUrlByFile = new Map();
  let imagesUploaded = 0;
  let imagesSkipped = 0;

  for (const filename of imageFiles) {
    const result = await uploadImage(filename);
    if (result.status === 'uploaded') {
      imagesUploaded += 1;
    } else {
      imagesSkipped += 1;
    }
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${STORAGE_PREFIX}/${filename}`);
    imageUrlByFile.set(filename, data.publicUrl);
  }

  const counters = {
    productsCreated: 0,
    productsSkipped: 0,
    variantsCreated: 0,
    variantsSkipped: 0,
  };

  for (const [index, item] of products.entries()) {
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', item.slug)
      .maybeSingle();
    if (findError) {
      throw new Error(`Cek produk ${item.slug} gagal: ${findError.message}`);
    }

    let productId = existing?.id;
    if (productId) {
      counters.productsSkipped += 1;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('products')
        .insert({
          slug: item.slug,
          name: item.name,
          name_en: item.name_en ?? null,
          category: item.category,
          pattern: item.pattern ?? null,
          description: item.description ?? null,
          heritage: item.heritage ?? null,
          details: item.details ?? null,
          price_idr: item.price_idr,
          weight_grams: 0,
          images: (item.images ?? []).map((file) => imageUrlByFile.get(file)),
          is_active: true,
          is_featured: Boolean(item.is_featured),
          is_bestseller: Boolean(item.is_bestseller),
          needs_verification: true,
          sort_order: index + 1,
        })
        .select('id')
        .single();
      if (insertError) {
        throw new Error(`Insert produk ${item.slug} gagal: ${insertError.message}`);
      }
      productId = inserted.id;
      counters.productsCreated += 1;
    }

    const { data: existingVariants, error: variantFindError } = await supabase
      .from('product_variants')
      .select('sku')
      .eq('product_id', productId);
    if (variantFindError) {
      throw new Error(`Cek varian ${item.slug} gagal: ${variantFindError.message}`);
    }
    const knownSkus = new Set((existingVariants ?? []).map((row) => row.sku));

    const newVariants = [];
    for (const size of item.sizes ?? []) {
      for (const color of item.colors ?? []) {
        const sku = makeSku(item.slug, size, color);
        if (knownSkus.has(sku)) {
          counters.variantsSkipped += 1;
          continue;
        }
        newVariants.push({
          product_id: productId,
          sku,
          size,
          color,
          stock_on_hand: PLACEHOLDER_STOCK,
          stock_reserved: 0,
          is_active: true,
        });
      }
    }

    if (newVariants.length > 0) {
      const { error: variantInsertError } = await supabase
        .from('product_variants')
        .insert(newVariants);
      if (variantInsertError) {
        throw new Error(
          `Insert varian ${item.slug} gagal: ${variantInsertError.message}`,
        );
      }
      counters.variantsCreated += newVariants.length;
    }
  }

  const { error: settingsError } = await supabase
    .from('site_settings')
    .upsert({ id: 1, tax: { mode: 'included', rate_percent: 11 } }, {
      onConflict: 'id',
    });
  if (settingsError) {
    throw new Error(`Update site_settings gagal: ${settingsError.message}`);
  }

  const { count: zoneCount, error: zoneCountError } = await supabase
    .from('shipping_zones')
    .select('id', { count: 'exact', head: true });
  if (zoneCountError) {
    throw new Error(`Cek shipping_zones gagal: ${zoneCountError.message}`);
  }

  if ((zoneCount ?? 0) === 0) {
    const { error: zoneInsertError } = await supabase
      .from('shipping_zones')
      .insert({
        name: 'Contoh zona (belum aktif - isi tarif asli)',
        rate_idr: 15000,
        eta_min_days: 1,
        eta_max_days: 2,
        provinces: ['DKI Jakarta'],
        is_active: false,
      });
    if (zoneInsertError) {
      throw new Error(`Insert zona contoh gagal: ${zoneInsertError.message}`);
    }
  }

  console.log(
    `${counters.productsCreated} produk baru, ${counters.productsSkipped} produk dilewati`,
  );
  console.log(
    `${counters.variantsCreated} varian baru, ${counters.variantsSkipped} varian dilewati`,
  );
  console.log(`${imagesUploaded} gambar tersimpan, ${imagesSkipped} gambar dilewati`);
  console.log('Seed OK');
}

main().catch((error) => {
  console.error('Seed FAIL:', error.message);
  process.exit(1);
});
