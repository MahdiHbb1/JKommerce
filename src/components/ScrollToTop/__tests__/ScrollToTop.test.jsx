import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import ScrollToTop from '../ScrollToTop';

const renderAt = (entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ScrollToTop />
      <Link to="/shop">Buka katalog</Link>
      <Link to="/shop#detail">Ke bagian detail</Link>
    </MemoryRouter>,
  );

describe('ScrollToTop', () => {
  let scrollToSpy;

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mengembalikan halaman ke atas saat pathname berubah', () => {
    renderAt('/');
    scrollToSpy.mockClear();

    fireEvent.click(screen.getByRole('link', { name: 'Buka katalog' }));

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  });

  it('tidak menggulir ke atas saat hanya hash yang berubah', () => {
    renderAt('/shop');
    scrollToSpy.mockClear();

    fireEvent.click(screen.getByRole('link', { name: 'Ke bagian detail' }));

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
