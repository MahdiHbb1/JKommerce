// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  validateCreateOrder,
  type CreateOrderInput,
} from '../validate';

const validBody = {
  items: [{ variant_id: 'variant-m-navy', qty: 2 }],
  customer: {
    name: 'Siti Rahma',
    email: 'siti@example.com',
    phone: '081234567890',
  },
  address: {
    recipient: 'Siti Rahma',
    phone: '081234567890',
    full_address: 'Jl. Malioboro No. 10, Yogyakarta',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    postal_code: '55271',
    country: 'ID',
    note: 'Rumah pagar hijau',
  },
  payment_preference: 'manual',
  accepts: {
    tos: true,
    privacy: true,
    versions: { tos: '2026-10-01', privacy: '2026-10-01' },
  },
  idempotency_key: 'order-2026-10-20-0001',
};

const expectError = (body: unknown, code: string) => {
  const result = validateCreateOrder(body);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors).toContain(code);
  }
};

describe('validateCreateOrder', () => {
  it('menerima payload valid dan mengisi country default ID', () => {
    const withoutCountry = {
      ...validBody,
      address: { ...validBody.address, country: undefined },
    };

    const result = validateCreateOrder(withoutCountry);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const value: CreateOrderInput = result.value;
      expect(value.items).toEqual([{ variant_id: 'variant-m-navy', qty: 2 }]);
      expect(value.customer.email).toBe('siti@example.com');
      expect(value.address.country).toBe('ID');
      expect(value.payment_preference).toBe('manual');
    }
  });

  it('menolak qty 0', () => {
    expectError(
      { ...validBody, items: [{ variant_id: 'variant-m-navy', qty: 0 }] },
      'item_0_qty_invalid',
    );
  });

  it('menolak qty di atas 10', () => {
    expectError(
      { ...validBody, items: [{ variant_id: 'variant-m-navy', qty: 11 }] },
      'item_0_qty_invalid',
    );
  });

  it('menolak field asing di level atas', () => {
    expectError({ ...validBody, extra: true }, 'unknown_field:extra');
  });

  it('menolak field asing di objek bersarang', () => {
    expectError(
      {
        ...validBody,
        customer: { ...validBody.customer, nik: '1234567890' },
      },
      'unknown_field:customer.nik',
    );
  });

  it('menolak email tidak valid', () => {
    expectError(
      { ...validBody, customer: { ...validBody.customer, email: 'bukan-email' } },
      'customer_email_invalid',
    );
  });

  it('menolak items kosong', () => {
    expectError({ ...validBody, items: [] }, 'items_required');
  });

  it('menolak items lebih dari 20 baris', () => {
    const items = Array.from({ length: 21 }, (_, index) => ({
      variant_id: `variant-${index}`,
      qty: 1,
    }));
    expectError({ ...validBody, items }, 'items_too_many');
  });

  it('menolak nomor telepon kurang dari 9 digit', () => {
    expectError(
      { ...validBody, customer: { ...validBody.customer, phone: '0812345' } },
      'customer_phone_invalid',
    );
  });

  it('menolak consent TOS yang tidak dicentang', () => {
    expectError(
      {
        ...validBody,
        accepts: { ...validBody.accepts, tos: false },
      },
      'accepts_tos_required',
    );
  });

  it('menolak payment_preference di luar manual/duitku', () => {
    expectError(
      { ...validBody, payment_preference: 'xendit' },
      'payment_preference_invalid',
    );
  });

  it('menolak idempotency_key terlalu pendek', () => {
    expectError({ ...validBody, idempotency_key: 'short' }, 'idempotency_key_invalid');
  });

  it('menolak body bukan objek', () => {
    expectError(null, 'body_invalid');
    expectError([], 'body_invalid');
  });

  it('menolak alamat tanpa provinsi', () => {
    const address = { ...validBody.address } as Record<string, unknown>;
    delete address.province;
    expectError({ ...validBody, address }, 'address_province_invalid');
  });

  it('menolak variant_id kosong', () => {
    expectError(
      { ...validBody, items: [{ variant_id: '   ', qty: 1 }] },
      'item_0_variant_id_invalid',
    );
  });

  it('menolak country selain ID', () => {
    expectError(
      { ...validBody, address: { ...validBody.address, country: 'SG' } },
      'address_country_invalid',
    );
  });
});
