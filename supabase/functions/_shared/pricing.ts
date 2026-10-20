export type TaxMode = 'included' | 'excluded' | 'none';

export interface TotalsLine {
  qty: number;
  unit_price_idr: number;
}

export interface TotalsInput {
  lines: TotalsLine[];
  shipping_idr: number;
  discount_idr: number;
  tax: {
    mode: TaxMode;
    rate_percent: number;
  };
}

export interface Totals {
  subtotal_idr: number;
  shipping_idr: number;
  discount_idr: number;
  tax_idr: number;
  total_idr: number;
}

const requireNonNegativeInt = (value: unknown, errorCode: string): number => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(errorCode);
  }
  return value;
};

/**
 * Hitung subtotal, pajak, dan total pesanan.
 *
 * `included`: harga katalog sudah termasuk pajak, jadi total tidak ditambah
 * pajak; `tax_idr` hanya nilai pajak terkandung untuk nota.
 * `excluded`: pajak ditambahkan ke total.
 * `none`: tanpa pajak.
 *
 * Ongkir wajib > 0 (v1 tidak mengenal gratis ongkir / ongkir tersembunyi).
 */
export function computeTotals(input: TotalsInput): Totals {
  if (!input || typeof input !== 'object' || !Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error('invalid_lines');
  }

  const shippingIdr = requireNonNegativeInt(input.shipping_idr, 'invalid_shipping');
  if (shippingIdr === 0) {
    throw new Error('shipping_unavailable');
  }

  const discountIdr = requireNonNegativeInt(input.discount_idr, 'invalid_discount');

  const tax = input.tax;
  if (!tax || (tax.mode !== 'included' && tax.mode !== 'excluded' && tax.mode !== 'none')) {
    throw new Error('invalid_tax_mode');
  }
  if (
    typeof tax.rate_percent !== 'number' ||
    !Number.isFinite(tax.rate_percent) ||
    tax.rate_percent < 0 ||
    tax.rate_percent > 100
  ) {
    throw new Error('invalid_tax_rate');
  }

  let subtotalIdr = 0;
  for (const line of input.lines) {
    const qty = requireNonNegativeInt(line?.qty, 'invalid_quantity');
    if (qty < 1) {
      throw new Error('invalid_quantity');
    }
    const unitPrice = requireNonNegativeInt(line?.unit_price_idr, 'invalid_unit_price');
    const lineTotal = qty * unitPrice;
    if (!Number.isSafeInteger(lineTotal)) {
      throw new Error('amount_overflow');
    }
    subtotalIdr += lineTotal;
    if (!Number.isSafeInteger(subtotalIdr)) {
      throw new Error('amount_overflow');
    }
  }

  if (discountIdr > subtotalIdr) {
    throw new Error('invalid_discount');
  }

  const taxableBase = subtotalIdr - discountIdr;
  let taxIdr = 0;
  let totalIdr = taxableBase + shippingIdr;

  if (tax.mode === 'included') {
    taxIdr = Math.round((taxableBase * tax.rate_percent) / (100 + tax.rate_percent));
  } else if (tax.mode === 'excluded') {
    taxIdr = Math.round((taxableBase * tax.rate_percent) / 100);
    totalIdr += taxIdr;
  }

  return {
    subtotal_idr: subtotalIdr,
    shipping_idr: shippingIdr,
    discount_idr: discountIdr,
    tax_idr: taxIdr,
    total_idr: totalIdr,
  };
}
