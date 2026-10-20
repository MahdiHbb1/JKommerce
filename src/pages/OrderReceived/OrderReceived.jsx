import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import './OrderReceived.css';

const OrderReceived = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, formatCurrency } = useTranslation();

  const state = location.state || {};
  const order = state.order;
  const items = Array.isArray(state.items) ? state.items : [];

  if (!order?.order_number) {
    return (
      <div className="order-received-page">
        <PageMeta title={t('checkout.receivedEyebrow')} noIndex />
        <div className="order-received-container">
          <div className="order-received-missing">
            <h1>{t('checkout.receivedNotFoundTitle')}</h1>
            <p>{t('checkout.receivedNotFoundBody')}</p>
            <Button onClick={() => navigate('/order-lookup')}>
              {t('checkout.openLookup')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalIdr = order.totals?.total_idr;
  const statusLabel =
    order.status === 'pending_payment'
      ? t('checkout.receivedStatus')
      : order.status;

  let deadlineLabel = null;
  if (order.expires_at) {
    const deadline = new Date(order.expires_at);
    if (!Number.isNaN(deadline.getTime())) {
      deadlineLabel = new Intl.DateTimeFormat(
        language === 'id' ? 'id-ID' : 'en-US',
        { dateStyle: 'long', timeStyle: 'short' },
      ).format(deadline);
    }
  }

  return (
    <div className="order-received-page">
      <PageMeta title={t('checkout.receivedEyebrow')} noIndex />

      <div className="order-received-container">
        <header className="order-received-header">
          <p className="order-received-eyebrow">
            {t('checkout.receivedEyebrow')}
          </p>
          <h1>{t('checkout.receivedTitle')}</h1>
          <p className="order-received-lead">{t('checkout.receivedLead')}</p>
        </header>

        <section className="order-received-receipt" aria-labelledby="receipt-heading">
          <h2 id="receipt-heading" className="sr-only">
            {t('checkout.orderSummary')}
          </h2>
          <dl className="receipt-grid">
            <div>
              <dt>{t('checkout.orderNumber')}</dt>
              <dd className="receipt-order-number">{order.order_number}</dd>
            </div>
            <div>
              <dt>{t('checkout.lookupStatus')}</dt>
              <dd>{statusLabel}</dd>
            </div>
            {Number.isInteger(totalIdr) ? (
              <div>
                <dt>{t('checkout.total')}</dt>
                <dd>{formatCurrency(totalIdr)}</dd>
              </div>
            ) : null}
            {deadlineLabel ? (
              <div>
                <dt>{t('checkout.paymentDeadline')}</dt>
                <dd>{deadlineLabel}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="order-received-section" aria-labelledby="next-steps-heading">
          <h2 id="next-steps-heading">{t('checkout.nextSteps')}</h2>
          <p>{t('checkout.receivedManualNote')}</p>
          <p className="order-received-note">
            {t('checkout.receivedExpiryNote')}
          </p>
        </section>

        {items.length > 0 ? (
          <section className="order-received-section" aria-labelledby="received-items-heading">
            <h2 id="received-items-heading">{t('checkout.receivedItems')}</h2>
            <ul className="received-items">
              {items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <div>
                    <span className="received-item-name">{item.name}</span>
                    <span className="received-item-meta">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                      {item.size || item.color ? ' · ' : ''}
                      {item.qty}×
                    </span>
                  </div>
                  <span className="received-item-price">
                    {formatCurrency(item.unit_price_idr * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="order-received-actions">
          <Button onClick={() => navigate('/order-lookup')}>
            {t('checkout.trackOrder')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/shop')}>
            {t('cart.continueShopping')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderReceived;
