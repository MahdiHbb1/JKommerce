import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../../context/LanguageContext';
import OrderHistory from '../OrderHistory';

const { useOrdersMock, cancelOrderMock, refreshOrdersMock } = vi.hoisted(() => ({
  useOrdersMock: vi.fn(),
  cancelOrderMock: vi.fn(),
  refreshOrdersMock: vi.fn(),
}));

vi.mock('../../../context/OrderContext', () => ({
  useOrders: () => useOrdersMock(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

const pendingOrder = {
  id: 'order-1',
  orderNumber: 'JK-20261020-0001',
  status: 'pending_payment',
  orderDate: '2026-10-20T03:00:00.000Z',
  total: 415_000,
  subtotal: 395_000,
  shipping: 20_000,
  discount: 0,
  tax: 36_667,
  taxMode: 'included',
  email: 'siti@example.com',
  courier: 'JNE Reguler',
  trackingNumber: null,
  expiresAt: '2026-10-21T03:00:00.000Z',
  items: [
    {
      name: 'Batik Tulis Parang',
      quantity: 1,
      price: 395_000,
      selectedSize: 'M',
      selectedColor: 'Navy',
    },
  ],
  shippingInfo: {
    fullName: 'Siti Rahma',
    phone: '081234567890',
    address: 'Jl. Malioboro No. 10',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    postalCode: '55271',
  },
};

const paidOrder = {
  ...pendingOrder,
  id: 'order-2',
  orderNumber: 'JK-20261020-0002',
  status: 'paid',
  paidAt: '2026-10-20T05:00:00.000Z',
};

const renderHistory = () =>
  render(
    <HelmetProvider>
      <LanguageProvider>
        <MemoryRouter>
          <OrderHistory />
        </MemoryRouter>
      </LanguageProvider>
    </HelmetProvider>,
  );

beforeEach(() => {
  localStorage.setItem('janoerkoening_language', 'id');
  useOrdersMock.mockReset();
  cancelOrderMock.mockReset();
  refreshOrdersMock.mockReset();
  useOrdersMock.mockReturnValue({
    orders: [pendingOrder],
    ordersLoading: false,
    ordersError: null,
    cancelOrder: cancelOrderMock,
    refreshOrders: refreshOrdersMock,
  });
});

describe('OrderHistory', () => {
  it('menampilkan tombol batal untuk pesanan pending dan memperbarui status setelah RPC sukses', async () => {
    cancelOrderMock.mockResolvedValue({ status: 'cancelled' });
    renderHistory();

    expect(
      screen.getAllByText(/Menunggu pembayaran/i).length,
    ).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole('button', {
        name: /Detail pesanan JK-20261020-0001/i,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Batalkan pesanan' }));
    expect(screen.getByText(/Stok akan dilepas/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Ya, batalkan pesanan/i }),
    );

    await waitFor(() => {
      expect(cancelOrderMock).toHaveBeenCalledWith(
        'JK-20261020-0001',
        'siti@example.com',
      );
    });
    expect(
      (await screen.findAllByText('Dibatalkan')).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: 'Batalkan pesanan' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/dibatalkan/i);
  });

  it('tidak menampilkan tombol batal untuk pesanan yang sudah dibayar', () => {
    useOrdersMock.mockReturnValue({
      orders: [paidOrder],
      ordersLoading: false,
      ordersError: null,
      cancelOrder: cancelOrderMock,
      refreshOrders: refreshOrdersMock,
    });
    renderHistory();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Detail pesanan JK-20261020-0002/i,
      }),
    );

    expect(screen.queryByRole('button', { name: 'Batalkan pesanan' })).toBe(
      null,
    );
    expect(screen.getAllByText(/^Dibayar$/i).length).toBeGreaterThan(0);
  });

  it('menampilkan alasan yang jelas saat pembatalan ditolak', async () => {
    cancelOrderMock.mockRejectedValue(
      Object.assign(new Error('invalid_status'), {
        code: 'invalid_status',
      }),
    );
    renderHistory();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Detail pesanan JK-20261020-0001/i,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Batalkan pesanan' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Ya, batalkan pesanan/i }),
    );

    expect(
      await screen.findByText(/tidak bisa dibatalkan lagi/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Menunggu pembayaran/i).length,
    ).toBeGreaterThan(0);
  });
});
