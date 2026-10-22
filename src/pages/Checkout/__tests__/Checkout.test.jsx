import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../../context/LanguageContext';
import Checkout from '../Checkout';
import {
  fetchPublicSettings,
  fetchShippingZones,
} from '../../../lib/db/catalog.js';

const { createOrderMock, clearCartMock } = vi.hoisted(() => ({
  createOrderMock: vi.fn(),
  clearCartMock: vi.fn(),
}));

vi.mock('../../../lib/db/catalog.js', () => ({
  fetchPublicSettings: vi.fn(),
  fetchShippingZones: vi.fn(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({
    cart: [
      {
        cartItemId: 'item-a',
        id: 'product-a',
        name: 'Parang Heritage',
        price: 150_000,
        quantity: 1,
        selectedSize: 'M',
        selectedColor: 'Navy',
        variantId: '11111111-1111-1111-1111-111111111111',
        images: ['https://example.test/parang.jpg'],
      },
      {
        cartItemId: 'item-b',
        id: 'product-b',
        name: 'Kawung Modern',
        price: 110_000,
        quantity: 2,
        selectedSize: 'L',
        selectedColor: 'Sogan',
        variantId: '22222222-2222-2222-2222-222222222222',
        images: ['https://example.test/kawung.jpg'],
      },
    ],
    getTotalPrice: () => 370_000,
    clearCart: clearCartMock,
  }),
}));

vi.mock('../../../context/OrderContext', () => ({
  useOrders: () => ({ createOrder: createOrderMock }),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const zone = {
  id: 'zone-1',
  name: 'JNE Reguler',
  rate_idr: 20_000,
  eta_min_days: 2,
  eta_max_days: 4,
  provinces: ['DI Yogyakarta', 'DKI Jakarta'],
  is_active: true,
};

const settings = {
  business: {},
  payment: {},
  legal: { tos_version: '2026-10-01', privacy_version: '2026-10-01' },
  tax: { mode: 'included', rate_percent: 11 },
};

const orderResponse = {
  order_number: 'JK-20261020-0001',
  status: 'pending_payment',
  totals: {
    subtotal_idr: 370_000,
    shipping_idr: 20_000,
    discount_idr: 0,
    tax_idr: 36_667,
    total_idr: 390_000,
    tax_mode: 'included',
  },
  expires_at: '2026-10-21T03:00:00.000Z',
};

const renderCheckout = () =>
  render(
    <HelmetProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<p>Keranjang</p>} />
            <Route path="/order-received" element={<p>Pesanan diterima</p>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </HelmetProvider>,
  );

const fillShippingForm = () => {
  fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
    target: { value: 'Siti Rahma' },
  });
  fireEvent.change(screen.getByLabelText(/Alamat Email/i), {
    target: { value: 'siti@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/Nomor Telepon/i), {
    target: { value: '081234567890' },
  });
  fireEvent.change(screen.getByLabelText(/Alamat Lengkap/i), {
    target: { value: 'Jl. Malioboro No. 10' },
  });
  fireEvent.change(screen.getByLabelText(/Kota\/Kabupaten/i), {
    target: { value: 'Yogyakarta' },
  });
  fireEvent.change(screen.getByLabelText(/Provinsi/i), {
    target: { value: 'DI Yogyakarta' },
  });
  fireEvent.change(screen.getByLabelText(/Kode Pos/i), {
    target: { value: '55271' },
  });
};

const goToConfirmation = async () => {
  fillShippingForm();
  fireEvent.click(
    screen.getByRole('button', { name: /Lanjutkan ke konfirmasi/i }),
  );
  return screen.findByRole('button', { name: /Selesaikan Pesanan/i });
};

const checkConsents = () => {
  fireEvent.click(
    screen.getByLabelText(/Saya setuju dengan Syarat & Ketentuan/i),
  );
  fireEvent.click(
    screen.getByLabelText(/Saya sudah membaca Kebijakan Privasi/i),
  );
};

describe('Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('janoerkoening_language', 'id');
    createOrderMock.mockReset();
    clearCartMock.mockReset();
    fetchShippingZones.mockReset();
    fetchPublicSettings.mockReset();
    fetchShippingZones.mockResolvedValue([zone]);
    fetchPublicSettings.mockResolvedValue(settings);
  });

  it('menampilkan ongkir dari zona provinsi yang dipilih', async () => {
    renderCheckout();

    await screen.findByLabelText(/Provinsi/i);
    await goToConfirmation();

    expect(screen.getAllByText(/JNE Reguler/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/20\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/termasuk PPN/i)).toBeInTheDocument();
  });

  it('tidak memanggil create-order bila consent belum dicentang', async () => {
    renderCheckout();

    await screen.findByLabelText(/Provinsi/i);
    await goToConfirmation();

    const submit = screen.getByRole('button', {
      name: /Selesaikan Pesanan/i,
    });
    expect(submit).toBeDisabled();

    fireEvent.click(submit);
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('mengirim payload benar dan pindah ke halaman pesanan diterima', async () => {
    createOrderMock.mockResolvedValue(orderResponse);
    renderCheckout();

    await screen.findByLabelText(/Provinsi/i);
    await goToConfirmation();
    checkConsents();
    fireEvent.click(
      screen.getByRole('button', { name: /Selesaikan Pesanan/i }),
    );

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));

    expect(createOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { variant_id: '11111111-1111-1111-1111-111111111111', qty: 1 },
          { variant_id: '22222222-2222-2222-2222-222222222222', qty: 2 },
        ],
        customer: {
          name: 'Siti Rahma',
          email: 'siti@example.com',
          phone: '081234567890',
        },
        address: expect.objectContaining({
          recipient: 'Siti Rahma',
          province: 'DI Yogyakarta',
          postal_code: '55271',
          country: 'ID',
        }),
        payment_preference: 'manual',
        accepts: {
          tos: true,
          privacy: true,
          versions: { tos: '2026-10-01', privacy: '2026-10-01' },
        },
        idempotency_key: expect.any(String),
      }),
    );
    expect(createOrderMock.mock.calls[0][0].idempotency_key.length).toBeGreaterThanOrEqual(8);
    expect(clearCartMock).toHaveBeenCalled();
    expect(await screen.findByText('Pesanan diterima')).toBeInTheDocument();
  });

  it('menampilkan pesan Indonesia yang jelas saat stok habis (409)', async () => {
    createOrderMock.mockRejectedValue(
      Object.assign(new Error('insufficient_stock'), {
        code: 'insufficient_stock',
        status: 409,
      }),
    );
    renderCheckout();

    await screen.findByLabelText(/Provinsi/i);
    await goToConfirmation();
    checkConsents();
    fireEvent.click(
      screen.getByRole('button', { name: /Selesaikan Pesanan/i }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/stok/i);
    expect(screen.getByText(/Selesaikan Pesanan/i)).toBeInTheDocument();
  });

  it('memblokir checkout dan menampilkan banner saat zona ongkir kosong', async () => {
    fetchShippingZones.mockResolvedValue([]);
    renderCheckout();

    expect(
      await screen.findByText(/belum menerima pesanan online/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Lanjutkan ke konfirmasi/i }),
    ).toBeDisabled();
  });
});
