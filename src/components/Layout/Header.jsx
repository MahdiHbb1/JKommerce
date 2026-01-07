import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTranslation } from '../../hooks/useTranslation';
import SearchBar from '../SearchBar/SearchBar';
import CartDrawer from '../Cart/CartDrawer';
import LanguageToggle from '../LanguageToggle/LanguageToggle';

/**
 * Header Component with Tailwind CSS
 * 
 * Features:
 * - Sticky navigation with shadow on scroll
 * - Responsive mobile menu
 * - Cart drawer integration
 * - Wishlist counter
 * - Search bar
 * - Active link highlighting
 * - Language toggle
 */

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { getTotalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { t } = useTranslation();
  const cartItemCount = getTotalItems();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Icons
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const ShoppingBagIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 bg-white transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex flex-col flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary-600 font-serif">Janoer Koening</h1>
              <span className="text-xs text-neutral-600 tracking-widest uppercase">Heritage Batik</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-600'
                  }`
                }
              >
                {t('nav.home')}
              </NavLink>
              <NavLink
                to="/shop"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-600'
                  }`
                }
              >
                {t('nav.shop')}
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-600'
                  }`
                }
              >
                {t('nav.about')}
              </NavLink>
            </nav>

            {/* Desktop Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle - Desktop */}
              <div className="hidden md:block mr-2">
                <LanguageToggle />
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                aria-label={t('common.search')}
              >
                <SearchIcon />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
                aria-label={t('nav.wishlist')}
              >
                <HeartIcon />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative"
                aria-label={t('nav.cart')}
              >
                <ShoppingBagIcon />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="md:hidden pb-4 animate-fade-in">
              <SearchBar onClose={() => setIsSearchOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
            onClick={closeMobileMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-20 left-0 right-0 bottom-0 bg-white z-40 md:hidden animate-slide-in-right overflow-y-auto">
            <nav className="flex flex-col p-6 space-y-4">
              {/* Language Toggle - Mobile */}
              <div className="pb-4 border-b border-neutral-200">
                <LanguageToggle />
              </div>

              <NavLink
                to="/"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `text-lg font-medium py-3 px-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                {t('nav.home')}
              </NavLink>
              <NavLink
                to="/shop"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `text-lg font-medium py-3 px-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                {t('nav.shop')}
              </NavLink>
              <NavLink
                to="/about"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `text-lg font-medium py-3 px-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                {t('nav.about')}
              </NavLink>

              {/* Additional Mobile Links */}
              <div className="pt-4 border-t border-neutral-200">
                <NavLink
                  to="/orders"
                  onClick={closeMobileMenu}
                  className="text-base text-neutral-600 hover:text-primary-600 py-2 px-4 block"
                >
                  {t('orders.title')}
                </NavLink>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  );
};

export default Header;
