/**
 * Ubah produk hasil `fetchProducts` (bentuk DB) menjadi bentuk yang dipakai
 * kartu produk lama: harga, stok total, ukuran, warna, dan tautan memakai slug.
 */
export function toCardProduct(product) {
  const variants = product.variants ?? [];
  const sizes = [];
  const colors = [];
  let stock = 0;

  for (const variant of variants) {
    if (variant.size && !sizes.includes(variant.size)) {
      sizes.push(variant.size);
    }
    if (variant.color && !colors.includes(variant.color)) {
      colors.push(variant.color);
    }
    stock += Number(variant.stock_available ?? 0);
  }

  return {
    ...product,
    price: product.price_idr,
    stock,
    sizes,
    colors,
    featured: product.is_featured,
    bestseller: product.is_bestseller,
  };
}
