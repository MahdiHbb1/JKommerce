import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import './CheckoutFailed.css';

const CheckoutFailed = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="checkout-failed-page">
      <PageMeta
        title="Payment Failed"
        description="Your payment could not be processed. Please try again."
      />
      <div className="container">
        <div className="failed-content">
          <div className="failed-icon">✕</div>
          
          <h1>{t('common.error')}</h1>
          
          <p className="failed-message">
            Pembayaran gagal. Silakan coba lagi atau hubungi layanan pelanggan.
          </p>

          <div className="failed-actions">
            <Button variant="primary" size="large" onClick={() => navigate('/')}>
              {t('checkout.backToHome')}
            </Button>
            <Button variant="outline" size="large" onClick={() => navigate('/cart')}>
              Kembali ke Keranjang
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFailed;
