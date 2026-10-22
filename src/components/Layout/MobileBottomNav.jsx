import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTranslation } from '../../hooks/useTranslation';
import Icon from '../ui/Icon';

const ITEMS = [
  { to: '/', end: true, icon: 'home', labelKey: 'nav.home' },
  { to: '/shop', icon: 'shop', labelKey: 'nav.shop' },
  { to: '/wishlist', icon: 'heart', labelKey: 'nav.wishlist', countKey: 'wishlist' },
  { to: '/cart', icon: 'bag', labelKey: 'nav.cart', countKey: 'cart' },
  { to: '/account', icon: 'user', labelKey: 'nav.account' },
];

const formatCount = (count) => (count > 99 ? '99+' : count);

const MobileBottomNav = () => {
  const { getTotalItems } = useCart();
  const { wishlistCount } = useWishlist();
  const { t } = useTranslation();
  const counts = {
    wishlist: wishlistCount,
    cart: getTotalItems(),
  };

  return (
    <nav
      aria-label={t('nav.primary')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper shadow-[0_-8px_24px_-20px_rgba(28,25,23,0.35)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const count = item.countKey ? counts[item.countKey] : 0;

          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => (
                  `relative flex min-h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-1 px-1 text-xs font-medium leading-none transition-colors duration-200 ${
                    isActive
                      ? 'text-[var(--color-brown-ink)]'
                      : 'text-[var(--color-ink-soft)] hover:text-[var(--color-brown-deep)]'
                  }`
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--color-gold)]"
                      />
                    )}
                    <span className="relative inline-flex h-6 w-6 items-center justify-center">
                      <Icon
                        name={item.icon}
                        size={22}
                        weight={isActive ? 'fill' : 'regular'}
                      />
                      {count > 0 && (
                        <span className="absolute -right-2 -top-1.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-[var(--color-gold)] px-1 text-[0.625rem] font-semibold leading-none text-[var(--color-paper)]">
                          {formatCount(count)}
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
