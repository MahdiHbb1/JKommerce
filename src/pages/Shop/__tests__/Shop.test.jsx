import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../../context/LanguageContext';
import Shop from '../Shop';
import { fetchProducts } from '../../../lib/db/catalog.js';

vi.mock('../../../lib/db/catalog.js', () => ({
  fetchProducts: vi.fn(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ success: vi.fn() }),
}));

vi.mock('../../../context/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: () => false,
    toggleWishlist: vi.fn(),
  }),
}));

const dbProducts = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'parang-heritage',
    name: 'Parang Heritage',
    name_en: 'Parang Heritage',
    category: 'Batik Tulis',
    pattern: 'Parang',
    description: 'Batik tulis dengan motif parang.',
    heritage: 'Warisan parang.',
    details: 'Canting tangan.',
    price_idr: 1850000,
    images: ['https://example.test/parang.jpg'],
    is_featured: true,
    is_bestseller: false,
    needs_verification: true,
    sort_order: 1,
    created_at: '2026-10-19T10:00:00.000Z',
    variants: [
      {
        id: 'v-1',
        sku: 'JK-PARANG-M',
        size: 'M',
        color: 'Navy',
        is_active: true,
        stock_available: 3,
      },
    ],
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'kawung-modern',
    name: 'Kawung Modern',
    name_en: 'Kawung Modern',
    category: 'Batik Cap',
    pattern: 'Kawung',
    description: 'Batik cap dengan motif kawung.',
    heritage: 'Warisan kawung.',
    details: 'Cap tembaga.',
    price_idr: 850000,
    images: ['https://example.test/kawung.jpg'],
    is_featured: false,
    is_bestseller: true,
    needs_verification: true,
    sort_order: 2,
    created_at: '2026-10-19T11:00:00.000Z',
    variants: [
      {
        id: 'v-2',
        sku: 'JK-KAWUNG-L',
        size: 'L',
        color: 'Brown',
        is_active: true,
        stock_available: 3,
      },
    ],
  },
];

const renderShop = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/shop']}>
        <LanguageProvider>
          <Shop />
        </LanguageProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeEach(() => {
  localStorage.setItem('janoerkoening_language', 'id');
  vi.clearAllMocks();
});

describe('Shop katalog dari Supabase', () => {
  it('menampilkan produk hasil fetchProducts', async () => {
    fetchProducts.mockResolvedValue(dbProducts);

    renderShop();

    expect(await screen.findByText('Parang Heritage')).toBeInTheDocument();
    expect(screen.getByText('Kawung Modern')).toBeInTheDocument();
    expect(fetchProducts).toHaveBeenCalledTimes(1);
  });

  it('memfilter kategori Batik Tulis', async () => {
    fetchProducts.mockResolvedValue(dbProducts);

    renderShop();
    await screen.findByText('Kawung Modern');

    fireEvent.click(
      screen.getByRole('checkbox', { name: /Batik Tulis/i }),
    );

    await waitFor(() => {
      expect(screen.queryByText('Kawung Modern')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Parang Heritage')).toBeInTheDocument();
  });

  it('menampilkan pesan error dan tombol coba lagi', async () => {
    fetchProducts
      .mockRejectedValueOnce(new Error('jaringan putus'))
      .mockResolvedValueOnce(dbProducts);

    renderShop();

    expect(
      await screen.findByText('Katalog belum bisa dimuat.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(await screen.findByText('Parang Heritage')).toBeInTheDocument();
    expect(fetchProducts).toHaveBeenCalledTimes(2);
  });

  it('menampilkan empty state saat katalog kosong', async () => {
    fetchProducts.mockResolvedValue([]);

    renderShop();

    expect(await screen.findByText('Belum ada produk')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Koleksi akan tampil di sini setelah produk aktif ditambahkan.',
      ),
    ).toBeInTheDocument();
  });
});
