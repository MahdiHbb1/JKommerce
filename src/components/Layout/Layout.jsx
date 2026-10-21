import React from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useTranslation } from '../../hooks/useTranslation';

const Layout = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:inline-flex focus:min-h-[44px] focus:items-center focus:rounded-sm focus:border focus:border-[var(--color-line-strong)] focus:bg-[var(--color-paper-raised)] focus:px-4 focus:text-sm focus:font-medium focus:text-[var(--color-ink)] focus:shadow-[var(--shadow-lift)]"
      >
        {t('common.skipToContent')}
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
