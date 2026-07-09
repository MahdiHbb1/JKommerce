import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import { formatPrice } from '../../data/products';
import PageMeta from '../../components/Seo/PageMeta';
import './OrderLookup.css';

const OrderLookup = () => {
  const { getOrderById } = useOrders();
  const { t, formatCurrency } = useTranslation();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupMessage, setLookupMessage] = useState('');

  const normalizeEmail = (value) => value.trim().toLowerCase();

  const statusLabel = useMemo(() => {
    if (!lookupResult) return '';

    const labels = {
      processing: t('orders.processing'),
      shipped: t('orders.shipped'),
      delivered: t('orders.delivered'),
      cancelled: t('orders.cancelled'),
      pending: t('orders.pending')
    };

    return labels[lookupResult.status] || lookupResult.status;
  }, [lookupResult, t]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedOrderNumber = orderNumber.trim();
    const trimmedEmail = normalizeEmail(email);

    if (!trimmedOrderNumber || !trimmedEmail) {
      setLookupResult(null);
      setLookupMessage(t('validation.required'));
      return;
    }

    const foundOrder = getOrderById(trimmedOrderNumber);

    if (!foundOrder) {
      setLookupResult(null);
      setLookupMessage(t('orders.lookupNoResults'));
      return;
    }

    const orderEmail = normalizeEmail(foundOrder.shippingInfo?.email || '');

    if (orderEmail !== trimmedEmail) {
      setLookupResult(null);
      setLookupMessage(t('orders.lookupEmailMismatch'));
      return;
    }

    setLookupResult(foundOrder);
    setLookupMessage('');
  };

  const handleReset = () => {
    setOrderNumber('');
    setEmail('');
    setLookupResult(null);
    setLookupMessage('');
  };

  return (
    <div className="order-lookup-page">
      <PageMeta
        title="Guest order lookup"
        description="Find an order by order number and email address without signing in."
      />
      <div className="container">
        <div className="lookup-hero">
          <div>
            <p className="lookup-kicker">{t('orders.orderHistory')}</p>
            <h1>{t('orders.guestLookupTitle')}</h1>
            <p>{t('orders.guestLookupDescription')}</p>
          </div>
          <Link to="/orders" className="lookup-back-link">
            {t('orders.orderHistory')}
          </Link>
        </div>

        <form className="lookup-form" onSubmit={handleSubmit}>
          <div className="lookup-field">
            <label htmlFor="orderNumber">{t('orders.lookupOrderNumber')}</label>
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="JK-XXXXXXXXXXXX"
              autoComplete="off"
            />
          </div>

          <div className="lookup-field">
            <label htmlFor="email">{t('orders.lookupEmail')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </div>

          <div className="lookup-actions">
            <Button variant="primary" size="large" type="submit">
              {t('orders.lookupSubmit')}
            </Button>
            <Button variant="outline" size="large" type="button" onClick={handleReset}>
              {t('orders.lookupReset')}
            </Button>
          </div>
        </form>

        {lookupMessage && <p className="lookup-message">{lookupMessage}</p>}

        {lookupResult && (
          <section className="lookup-result">
            <div className="lookup-result-header">
              <div>
                <p className="lookup-kicker">{t('orders.lookupResults')}</p>
                <h2>{lookupResult.orderNumber || lookupResult.id}</h2>
              </div>
              <span className={`lookup-status status-${lookupResult.status}`}>{statusLabel}</span>
            </div>

            <div className="lookup-grid">
              <article>
                <h3>{t('orders.lookupItems')}</h3>
                <ul className="lookup-items">
                  {lookupResult.items?.map((item, index) => (
                    <li key={`${item.id || index}-${index}`}>
                      <span>{item.name} x {item.quantity}</span>
                      <strong>{formatPrice((item.price || 0) * (item.quantity || 0))}</strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article>
                <h3>{t('orders.lookupShippingAddress')}</h3>
                <p>{lookupResult.shippingInfo?.fullName}</p>
                <p>{lookupResult.shippingInfo?.address}</p>
                <p>{lookupResult.shippingInfo?.city}, {lookupResult.shippingInfo?.province} {lookupResult.shippingInfo?.postalCode}</p>
                <p>{lookupResult.shippingInfo?.email}</p>
              </article>

              <article>
                <h3>{t('orders.lookupPaymentMethod')}</h3>
                <p>{lookupResult.paymentMethod}</p>
                <p className="lookup-meta-label">{t('orders.lookupOrderDate')}</p>
                <p>{new Date(lookupResult.orderDate).toLocaleString()}</p>
              </article>

              <article>
                <h3>{t('orders.lookupTotal')}</h3>
                <p className="lookup-total">{formatCurrency(lookupResult.total || 0)}</p>
              </article>
            </div>

            <div className="lookup-footer-note">
              <strong>{t('orders.lookupStatus')}:</strong> {statusLabel}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default OrderLookup;