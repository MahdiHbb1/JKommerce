import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container-custom">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section">
            <p className="footer-brand">Janoer Koening</p>
            <p className="footer-tagline">{t('footer.tagline')}</p>
            <p className="footer-description">
              {t('footer.description')}
            </p>
          </div>

          {/* Explore */}
          <div className="footer-section">
            <h2 className="footer-title">{t('footer.quickLinks')}</h2>
            <ul className="footer-links">
              <li><Link to="/">{t('nav.home')}</Link></li>
              <li><Link to="/shop">{t('nav.shop')}</Link></li>
              <li><Link to="/about">{t('nav.about')}</Link></li>
            </ul>
          </div>

          {/* Account & Orders */}
          <div className="footer-section">
            <h2 className="footer-title">{t('footer.accountArea')}</h2>
            <ul className="footer-links">
              <li><Link to="/orders">{t('nav.orders')}</Link></li>
              <li><Link to="/order-lookup">{t('footer.trackOrder')}</Link></li>
              <li><Link to="/wishlist">{t('nav.wishlist')}</Link></li>
              <li><Link to="/account">{t('nav.account')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
