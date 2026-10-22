import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';

vi.mock('../../../context/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: () => false,
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useTranslation', () => {
  const strings = {
    'product.addToCart': 'Masukkan Keranjang',
    'product.outOfStock': 'Stok habis',
    'product.noImage': 'Foto belum tersedia',
    'product.quickView': 'Pratinjau Cepat',
    'product.addToWishlist': 'Simpan ke Favorit',
    'product.removeFromWishlist': 'Hapus dari Favorit',
    'product.featured': 'Pilihan Istimewa',
    'product.bestSeller': 'Karya Pilihan',
    'product.viewDetails': 'Lihat Detail',
    'product.stockAvailable': '{stock} tersedia',
  };

  return {
    useTranslation: () => ({
      t: (key, params = {}) => {
        const value = strings[key] ?? key;

        return value.replace(/\{(\w+)\}/g, (match, paramKey) =>
          params[paramKey] !== undefined ? params[paramKey] : match,
        );
      },
    }),
  };
});

const product = {
  id: 'product-1',
  slug: 'kain-sogan',
  name: 'Kain Sogan',
  price: 450000,
  pattern: 'Parang',
  category: 'Batik Tulis',
  images: ['/kain-sogan.jpg'],
  stock: 4,
  featured: false,
  bestseller: false,
};

const renderCard = () =>
  render(
    <MemoryRouter>
      <ProductCard product={product} onAddToCart={vi.fn()} onQuickView={vi.fn()} />
    </MemoryRouter>,
  );

describe('ProductCard', () => {
  it('keeps the product name and add-to-cart action in separate, non-nested controls', () => {
    const { container } = renderCard();

    expect(container.querySelector('a button')).toBeNull();

    const heading = screen.getByRole('heading', { name: 'Kain Sogan' });
    const nameLink = within(heading).getByRole('link');

    expect(nameLink).toHaveAttribute('href', '/product/kain-sogan');
    expect(
      screen.getByRole('button', { name: 'Masukkan Keranjang' }),
    ).toBeEnabled();
  });

  it('shows no curation badge without a real flag and keeps card controls available', () => {
    renderCard();

    expect(screen.queryByText('Karya Pilihan')).not.toBeInTheDocument();
    expect(screen.queryByText('Pilihan Istimewa')).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Pratinjau Cepat' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Simpan ke Favorit' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
