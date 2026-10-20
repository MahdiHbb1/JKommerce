// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { computeTotals } from '../pricing';

describe('computeTotals', () => {
  it('mode included: pajak terkandung, total tidak ditambah pajak', () => {
    const totals = computeTotals({
      lines: [{ qty: 1, unit_price_idr: 1_000_000 }],
      shipping_idr: 20_000,
      discount_idr: 0,
      tax: { mode: 'included', rate_percent: 11 },
    });

    expect(totals).toEqual({
      subtotal_idr: 1_000_000,
      shipping_idr: 20_000,
      discount_idr: 0,
      tax_idr: 99_099,
      total_idr: 1_020_000,
    });
  });

  it('mode excluded: pajak ditambahkan ke total', () => {
    const totals = computeTotals({
      lines: [{ qty: 2, unit_price_idr: 50_000 }],
      shipping_idr: 15_000,
      discount_idr: 0,
      tax: { mode: 'excluded', rate_percent: 11 },
    });

    expect(totals.tax_idr).toBe(11_000);
    expect(totals.total_idr).toBe(126_000);
  });

  it('mode none: pajak nol', () => {
    const totals = computeTotals({
      lines: [{ qty: 1, unit_price_idr: 50_000 }],
      shipping_idr: 10_000,
      discount_idr: 0,
      tax: { mode: 'none', rate_percent: 11 },
    });

    expect(totals.tax_idr).toBe(0);
    expect(totals.total_idr).toBe(60_000);
  });

  it('menolak ongkir 0 (tanpa gratis ongkir)', () => {
    expect(() =>
      computeTotals({
        lines: [{ qty: 1, unit_price_idr: 100_000 }],
        shipping_idr: 0,
        discount_idr: 0,
        tax: { mode: 'included', rate_percent: 11 },
      }),
    ).toThrow('shipping_unavailable');
  });

  it('menolak qty 0 dan nominal bukan integer', () => {
    expect(() =>
      computeTotals({
        lines: [{ qty: 0, unit_price_idr: 100_000 }],
        shipping_idr: 10_000,
        discount_idr: 0,
        tax: { mode: 'none', rate_percent: 0 },
      }),
    ).toThrow('invalid_quantity');

    expect(() =>
      computeTotals({
        lines: [{ qty: 1, unit_price_idr: 10_000.5 }],
        shipping_idr: 10_000,
        discount_idr: 0,
        tax: { mode: 'none', rate_percent: 0 },
      }),
    ).toThrow('invalid_unit_price');
  });

  it('menolak diskon melebihi subtotal', () => {
    expect(() =>
      computeTotals({
        lines: [{ qty: 1, unit_price_idr: 50_000 }],
        shipping_idr: 10_000,
        discount_idr: 60_000,
        tax: { mode: 'included', rate_percent: 11 },
      }),
    ).toThrow('invalid_discount');
  });
});
