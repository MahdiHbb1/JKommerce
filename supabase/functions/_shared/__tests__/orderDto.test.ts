// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { toPublicOrder, type OrderRowWithItems } from '../orderDto';

const row: OrderRowWithItems = {
  order_number: 'JK-20261020-0001',
  status: 'pending_payment',
  subtotal_idr: 350_000,
  shipping_idr: 20_000,
  discount_idr: 0,
  tax_idr: 34_684,
  total_idr: 370_000,
  tax_mode: 'included',
  courier: 'JNE REG',
  tracking_number: null,
  created_at: '2026-10-20T03:00:00.000Z',
  paid_at: null,
  shipped_at: null,
  delivered_at: null,
  expires_at: '2026-10-21T03:00:00.000Z',
  email: 'siti@example.com',
  user_id: '11111111-1111-1111-1111-111111111111',
  internal_note: 'catatan internal pemilik',
  payload: { rahasia: true },
  order_items: [
    {
      name_snapshot: 'Parang Heritage',
      qty: 2,
      unit_price_idr: 175_000,
    },
  ],
};

describe('toPublicOrder', () => {
  it('memetakan hanya field publik yang dibutuhkan pelacakan', () => {
    expect(toPublicOrder(row)).toEqual({
      order_number: 'JK-20261020-0001',
      status: 'pending_payment',
      totals: {
        subtotal_idr: 350_000,
        shipping_idr: 20_000,
        discount_idr: 0,
        tax_idr: 34_684,
        total_idr: 370_000,
        tax_mode: 'included',
      },
      items: [
        {
          name: 'Parang Heritage',
          qty: 2,
          unit_price_idr: 175_000,
        },
      ],
      courier: 'JNE REG',
      tracking_number: null,
      created_at: '2026-10-20T03:00:00.000Z',
      paid_at: null,
      shipped_at: null,
      delivered_at: null,
      expires_at: '2026-10-21T03:00:00.000Z',
    });
  });

  it('tidak membocorkan field internal', () => {
    const dto = toPublicOrder(row);

    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('user_id');
    expect(dto).not.toHaveProperty('email');
    expect(dto).not.toHaveProperty('internal_note');
    expect(dto).not.toHaveProperty('payload');
    expect(dto).not.toHaveProperty('customer');
    expect(dto).not.toHaveProperty('address');
    expect(dto.items[0]).not.toHaveProperty('line_total_idr');
    expect(dto.items[0]).not.toHaveProperty('variant_snapshot');
  });

  it('mengembalikan daftar item kosong bila relasi tidak ada', () => {
    const dto = toPublicOrder({ ...row, order_items: undefined });

    expect(dto.items).toEqual([]);
  });
});
