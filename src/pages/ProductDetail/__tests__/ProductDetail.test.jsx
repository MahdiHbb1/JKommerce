import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from '../../../context/LanguageContext';
import ProductDetail from '../ProductDetail';
import { fetchProductBySlug, fetchProducts } from '../../../lib/db/catalog.js';

const mocks = vi.hoisted(() => ({
  addToCart: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../../../lib/db/catalog.js', () => ({
  fetchProductBySlug: vi.fn(),
  fetchProducts: vi.fn(),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({ addToCart: mocks.addToCart }),
}));

vi.mock('../../../context/WishlistContext', () => ({
  useWishlist: () => ({ isInWishlist: () => false, toggleWishlist: vi.fn() }),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));

vi.mock('../../../context/RecentlyViewedContext', () => ({
  useRecentlyViewed: () => ({
    addToRecentlyViewed: vi.fn(),
    getRecentlyViewed: () => [],
  }),
}));

const baseProduct = {
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
      id: 'variant-m-navy',
      sku: 'JK-PARANG-M-NAVY',
      size: 'M',
      color: 'Navy',
      is_active: true,
      stock_available: 3,
    },
    {
      id: 'variant-l-navy',
      sku: 'JK-PARANG-L-NAVY',
      size: 'L',
      color: 'Navy',
      is_active: true,
      stock_available: 0,
    },
  ],
};

const renderDetail = (slug = 'parang-heritage') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/product/${slug}`]}>
        <LanguageProvider>
          <Routes>
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/shop" element={<div>SHOP PAGE</div>} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeEach(() => {
  localStorage.setItem('janoerkoening_language', 'id');
  vi.clearAllMocks();
});

describe('ProductDetail berbasis varian', () => {
  it('mengirim varian terpilih yang benar ke keranjang', async () => {
    fetchProductBySlug.mockResolvedValue(baseProduct);
    fetchProducts.mockResolvedValue([]);

    renderDetail();
    expect(
      await screen.findByRole('heading', { name: 'Parang Heritage' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Masukkan Keranjang' }));

    expect(mocks.addToCart).toHaveBeenCalledTimes(1);
    expect(mocks.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'parang-heritage' }),
      1,
      'M',
      'Navy',
      expect.objectContaining({
        id: 'variant-m-navy',
        sku: 'JK-PARANG-M-NAVY',
        stock_available: 3,
      }),
    );
  });

  it('menonaktifkan tombol untuk kombinasi varian yang stoknya 0', async () => {
    fetchProductBySlug.mockResolvedValue(baseProduct);
    fetchProducts.mockResolvedValue([]);

    renderDetail();
    await screen.findByRole('heading', { name: 'Parang Heritage' });

    fireEvent.click(screen.getByRole('button', { name: 'L' }));

    const outOfStockButton = await screen.findByRole('button', {
      name: 'Stok habis',
    });
    expect(outOfStockButton).toBeDisabled();
  });

  it('tidak menampilkan ulasan atau rating karangan', async () => {
    fetchProductBySlug.mockResolvedValue(baseProduct);
    fetchProducts.mockResolvedValue([]);

    renderDetail();
    await screen.findByRole('heading', { name: 'Parang Heritage' });

    expect(screen.queryByText('Sarah Wijaya')).not.toBeInTheDocument();
    expect(screen.queryByText('Ahmad Kusuma')).not.toBeInTheDocument();
    expect(screen.queryByText('Tulis Ulasan')).not.toBeInTheDocument();
    expect(screen.queryByText('Apa Kata Pelanggan')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('5 stars')).not.toBeInTheDocument();
    expect(screen.getByText('Belum ada ulasan')).toBeInTheDocument();
  });

  it('tetap tampil untuk produk tanpa gambar', async () => {
    fetchProductBySlug.mockResolvedValue({ ...baseProduct, images: [] });
    fetchProducts.mockResolvedValue([]);

    renderDetail();

    expect(await screen.findByText('Foto belum tersedia')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Parang Heritage' }),
    ).toBeInTheDocument();
  });

  it('kembali ke katalog bila slug tidak ditemukan', async () => {
    fetchProductBySlug.mockResolvedValue(null);

    renderDetail('tidak-ada');

    expect(await screen.findByText('SHOP PAGE')).toBeInTheDocument();
  });

  it('menampilkan pesan error dan bisa mencoba lagi', async () => {
    fetchProductBySlug
      .mockRejectedValueOnce(new Error('jaringan putus'))
      .mockResolvedValueOnce(baseProduct);
    fetchProducts.mockResolvedValue([]);

    renderDetail();

    expect(
      await screen.findByText('Detail produk belum bisa dimuat'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));

    expect(
      await screen.findByRole('heading', { name: 'Parang Heritage' }),
    ).toBeInTheDocument();
    expect(fetchProductBySlug).toHaveBeenCalledTimes(2);
  });
});
