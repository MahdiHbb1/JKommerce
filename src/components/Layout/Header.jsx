import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTranslation } from '../../hooks/useTranslation';
import SearchBar from '../SearchBar/SearchBar';
import CartDrawer from '../Cart/CartDrawer';
import LanguageToggle from '../LanguageToggle/LanguageToggle';
import Icon from '../ui/Icon';

/**
 * Storefront header: desktop navigation, search, and the mobile menu panel.
 * Cart and wishlist entry points move to MobileBottomNav below the md breakpoint.
 */

const CountBadge = ({ count }) => (
  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[var(--color-gold)] px-1 text-[0.6875rem] font-semibold leading-none text-[var(--color-paper)]">
    {count > 99 ? '99+' : count}
  </span>
);

const desktopNavClass = ({ isActive }) => (
  `relative inline-flex min-h-[44px] items-center text-sm font-medium tracking-wide transition-colors duration-200 after:absolute after:bottom-1 after:left-0 after:h-px after:w-full after:bg-[var(--color-gold)] after:opacity-0 after:transition-opacity after:duration-200 after:content-[''] ${
    isActive
      ? 'text-[var(--color-brown-ink)] after:opacity-100'
      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-brown-deep)]'
  }`
);

const mobileMenuLinkClass = ({ isActive }) => (
  `flex min-h-[44px] items-center rounded-sm px-4 text-base font-medium transition-colors duration-200 ${
    isActive
      ? 'bg-[var(--color-paper-deep)] text-[var(--color-brown-ink)]'
      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-deep)] hover:text-[var(--color-brown-ink)]'
  }`
);

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { getTotalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { t } = useTranslation();
  const location = useLocation();
  const cartItemCount = getTotalItems();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const openMobileMenu = () => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const toggleSearch = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen((prev) => !prev);
  };

  const menuBottomOffset = {
    bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-paper transition-shadow duration-300 ${
          isScrolled ? 'shadow-[var(--shadow-lift)]' : 'shadow-none'
        }`}
      >
        <div className="container-custom">
          <div className="flex h-20 items-center justify-between gap-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex min-h-[44px] flex-col justify-center"
            >
              <span className="font-serif text-xl font-semibold leading-none tracking-tight text-[var(--color-brown-ink)] sm:text-2xl">
                Janoer Koening
              </span>
              <span className="mt-1 text-[0.625rem] uppercase tracking-[0.24em] text-[var(--color-ink-soft)]">
                Heritage Batik
              </span>
            </Link>

            <nav aria-label={t('nav.primary')} className="hidden items-center gap-8 md:flex">
              <NavLink to="/" end className={desktopNavClass}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/shop" className={desktopNavClass}>
                {t('nav.shop')}
              </NavLink>
              <NavLink to="/about" className={desktopNavClass}>
                {t('nav.about')}
              </NavLink>
            </nav>

            <div className="mx-8 hidden w-full max-w-md flex-1 lg:block">
              <SearchBar />
            </div>

            <div className="flex items-center gap-1">
              <div className="hidden md:mr-1 md:block">
                <LanguageToggle />
              </div>

              <button
                type="button"
                onClick={toggleSearch}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--color-ink-soft)] transition-colors duration-200 hover:bg-[var(--color-paper-deep)] hover:text-[var(--color-brown-ink)] lg:hidden"
                aria-label={t('common.search')}
                aria-expanded={isSearchOpen}
                aria-controls="mobile-search"
              >
                <Icon name={isSearchOpen ? 'close' : 'search'} size={22} />
              </button>

              <Link
                to="/wishlist"
                className="relative hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-3 text-[var(--color-ink-soft)] transition-colors duration-200 hover:bg-[var(--color-paper-deep)] hover:text-[var(--color-brown-ink)] md:inline-flex"
                aria-label={t('nav.wishlist')}
              >
                <Icon name="heart" size={22} />
                {wishlistCount > 0 && <CountBadge count={wishlistCount} />}
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-3 text-[var(--color-ink-soft)] transition-colors duration-200 hover:bg-[var(--color-paper-deep)] hover:text-[var(--color-brown-ink)] md:inline-flex"
                aria-label={t('nav.cart')}
              >
                <Icon name="bag" size={22} />
                {cartItemCount > 0 && <CountBadge count={cartItemCount} />}
              </button>

              <button
                type="button"
                onClick={toggleMobileMenu}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-line px-3 text-sm font-medium text-[var(--color-ink-soft)] transition-colors duration-200 hover:border-[var(--color-line-strong)] hover:text-[var(--color-brown-ink)] md:hidden"
                aria-label={t('nav.menu')}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <Icon name={isMobileMenuOpen ? 'close' : 'menu'} size={20} />
                <span>{t('nav.menu')}</span>
              </button>
            </div>
          </div>
        </div>

        {isSearchOpen && (
          <div
            id="mobile-search"
            className="absolute inset-x-0 top-full border-b border-line bg-paper p-4 shadow-[var(--shadow-lift)] lg:hidden"
          >
            <SearchBar isMobile onClose={() => setIsSearchOpen(false)} />
          </div>
        )}
      </header>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 animate-fade-in bg-[rgba(28,25,23,0.45)] md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <div
            id="mobile-menu"
            className="fixed left-0 right-0 top-20 z-30 animate-fade-in overflow-y-auto bg-paper md:hidden"
            style={menuBottomOffset}
          >
            <nav aria-label={t('nav.menu')} className="flex flex-col p-6">
              <div className="mb-2 border-b border-line pb-4">
                <LanguageToggle />
              </div>

              <NavLink to="/about" onClick={closeMobileMenu} className={mobileMenuLinkClass}>
                {t('nav.about')}
              </NavLink>
              <NavLink to="/orders" onClick={closeMobileMenu} className={mobileMenuLinkClass}>
                {t('nav.orders')}
              </NavLink>
            </nav>
          </div>
        </>
      )}

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <div className="h-20" />
    </>
  );
};

export default Header;
