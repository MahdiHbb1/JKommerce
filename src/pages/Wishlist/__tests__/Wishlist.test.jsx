import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Wishlist from '../Wishlist';

const mocks = vi.hoisted(() => ({
  addToCart: vi.fn(),
  success: vi.fn(),
  clearWishlist: vi.fn(),
  toggleWishlist: vi.fn(),
  wishlistItems: [],
}));

vi.mock('../../../context/WishlistContext', () => ({
  useWishlist: () => ({
    wishlistItems: mocks.wishlistItems,
    clearWishlist: mocks.clearWishlist,
    isInWishlist: () => true,
    toggleWishlist: mocks.toggleWishlist,
  }),
}));

vi.mock('../../../context/CartContext', () => ({
  useCart: () => ({ addToCart: mocks.addToCart }),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({ success: mocks.success }),
}));

vi.mock('../../../hooks/useTranslation', () => {
  const strings = {
    'nav.wishlist': 'Favorit',
    'wishlist.title': 'Daftar Favorit',
    'wishlist.metaDescription': 'Kain batik favorit yang Anda simpan untuk dilihat kembali.',
    'wishlist.itemsHeading': 'Karya favorit',
    'wishlist.item': 'item',
    'wishlist.items': 'item',
    'wishlist.clearAll': 'Hapus Semua',
    'wishlist.empty': 'Belum Ada Favorit',
    'wishlist.emptyMessage': 'Simpan produk favorit Anda untuk kemudahan berbelanja',
    'wishlist.continueShopping': 'Lanjutkan Berbelanja',
    'notifications.addedToCart': 'telah ditambahkan ke keranjang',
    'product.addToCart': 'Masukkan Keranjang',
    'product.quickView': 'Pratinjau Cepat',
    'product.addToWishlist': 'Simpan ke Favorit',
    'product.removeFromWishlist': 'Hapus dari Favorit',
    'product.noImage': 'Foto belum tersedia',
    'product.outOfStock': 'Stok habis',
    'product.featured': 'Pilihan Istimewa',
    'product.bestSeller': 'Karya Pilihan',
    'product.stockAvailable': '{stock} tersedia',
    'product.viewDetails': 'Lihat Detail',
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

const wishlistItem = {
  id: 'product-1',
  slug: 'kain-sogan',
  name: 'Kain Sogan',
  price: 450000,
  image: '/kain-sogan.jpg',
  category: 'Batik Tulis',
  pattern: 'Parang',
  stock: 4,
  sizes: ['M'],
  colors: ['Sogan'],
  featured: false,
  bestseller: false,
};

const renderWishlist = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Wishlist />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('Wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menampilkan favorit dalam bahasa Indonesia dengan kartu produk', () => {
    mocks.wishlistItems = [wishlistItem];
    renderWishlist();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Daftar Favorit' }),
    ).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(1);

    expect(
      within(cards[0]).getByRole('img', { name: 'Kain Sogan' }),
    ).toHaveAttribute('src', '/kain-sogan.jpg');

    const nameHeading = within(cards[0]).getByRole('heading', {
      name: 'Kain Sogan',
    });
    expect(within(nameHeading).getByRole('link')).toHaveAttribute(
      'href',
      '/product/kain-sogan',
    );
  });

  it('menampilkan keadaan kosong dalam bahasa Indonesia', () => {
    mocks.wishlistItems = [];
    renderWishlist();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Daftar Favorit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Belum Ada Favorit' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Lanjutkan Berbelanja' }),
    ).toHaveAttribute('href', '/shop');
  });

  it('menambahkan produk ke keranjang dengan jumlah dan pesan yang benar', () => {
    mocks.wishlistItems = [wishlistItem];
    renderWishlist();

    fireEvent.click(
      screen.getByRole('button', { name: 'Masukkan Keranjang' }),
    );

    expect(mocks.addToCart).toHaveBeenCalledTimes(1);
    expect(mocks.addToCart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'product-1' }),
      1,
    );
    expect(mocks.success).toHaveBeenCalledWith(
      'telah ditambahkan ke keranjang',
    );
  });

  it('menghapus semua favorit lewat aksi yang terlihat', () => {
    mocks.wishlistItems = [wishlistItem];
    renderWishlist();

    fireEvent.click(screen.getByRole('button', { name: 'Hapus Semua' }));

    expect(mocks.clearWishlist).toHaveBeenCalledTimes(1);
  });
});
