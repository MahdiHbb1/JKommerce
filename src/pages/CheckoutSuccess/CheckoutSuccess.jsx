import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import './CheckoutSuccess.css';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getOrderById } = useOrders();
  const { t } = useTranslation();
  const [orderNumber, setOrderNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('processing');
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const externalId = searchParams.get('external_id');
    if (externalId) {
      setOrderNumber(externalId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!orderNumber || !isPolling) return;

    const pollInterval = setInterval(() => {
      const order = getOrderById(orderNumber);
      if (order && order.status !== 'processing') {
        setOrderStatus(order.status);
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 3000);

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setIsPolling(false);
      clearInterval(pollInterval);
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [orderNumber, isPolling, getOrderById]);

  const handleRefresh = () => {
    const order = getOrderById(orderNumber);
    if (order) {
      setOrderStatus(order.status);
    }
    setIsPolling(true);
  };

  return (
    <div className="checkout-success-page">
      <PageMeta
        title="Payment Successful"
        description="Your payment has been received and your order is being processed."
      />
      <div className="container">
        <div className="success-content">
          <div className="success-icon">
            {orderStatus === 'paid' ? '✓' : '⟳'}
          </div>
          
          <h1>
            {orderStatus === 'paid' 
              ? t('checkout.orderSuccess') 
              : t('checkout.processing')
            }
          </h1>
          
          <p className="success-message">
            {orderStatus === 'paid'
              ? t('checkout.thankYou')
              : 'Menunggu konfirmasi pembayaran...'
            }
          </p>

          {orderNumber && (
            <div className="order-details-box">
              <div className="order-detail-row">
                <span>{t('checkout.orderNumber')}:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div className="order-detail-row">
                <span>Status:</span>
                <strong>
                  {orderStatus === 'paid' ? 'Paid' : 'Processing'}
                </strong>
              </div>
            </div>
          )}

          {isPolling && (
            <p className="polling-message">
              Memeriksa status pembayaran secara otomatis...
            </p>
          )}

          <div className="success-actions">
            <Button variant="primary" size="large" onClick={() => navigate('/')}>
              {t('checkout.backToHome')}
            </Button>
            <Button variant="outline" size="large" onClick={() => navigate('/orders')}>
              {t('checkout.viewOrders')}
            </Button>
            {isPolling && (
              <Button variant="outline" size="large" onClick={handleRefresh}>
                Refresh Status
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
