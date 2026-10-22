import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useOrders } from '../../context/OrderContext';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import OrderTimeline, {
  getOrderStatusKey,
  isCancellableStatus,
} from '../../components/OrderTimeline/OrderTimeline';
import './OrderLookup.css';

const cancelErrorKey = (code) => {
  if (code === 'invalid_status') return 'orders.cancelErrorInvalidStatus';
  if (code === 'order_not_found') return 'orders.cancelErrorNotFound';
  if (code === 'rate_limited') return 'orders.cancelErrorRate';
  return 'orders.cancelErrorGeneric';
};

const lookupErrorKey = (code) => {
  if (code === 'order_not_found') return 'orders.lookupNoResults';
  if (code === 'email_mismatch') return 'orders.lookupEmailMismatch';
  if (code === 'rate_limited') return 'orders.lookupRate';
  if (code === 'invalid_request') return 'orders.lookupInvalid';
  return 'orders.lookupGeneric';
};

const OrderLookup = () => {
  const { t, language, formatCurrency } = useTranslation();
  const { cancelOrder } = useOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [orderNumber, setOrderNumber] = useState(
    searchParams.get('order')?.trim() || '',
  );
  const [email, setEmail] = useState(location.state?.email || '');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupMessage, setLookupMessage] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState(null);
  const resultHeadingRef = useRef(null);
  const cancelHeadingRef = useRef(null);
  const cancelTriggerRef = useRef(null);

  useEffect(() => {
    if (lookupResult?.order_number) {
      resultHeadingRef.current?.focus();
    }
  }, [lookupResult?.order_number]);

  useEffect(() => {
    if (cancelTarget) {
      cancelHeadingRef.current?.focus();
    }
  }, [cancelTarget]);

  useEffect(() => {
    if (!cancelTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isCancelling) {
        setCancelTarget(false);
        window.setTimeout(() => {
          cancelTriggerRef.current?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelTarget, isCancelling]);

  const closeCancel = () => {
    setCancelTarget(false);
    window.setTimeout(() => {
      cancelTriggerRef.current?.focus();
    }, 0);
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const statusLabel = lookupResult
    ? getOrderStatusKey(lookupResult.status)
      ? t(getOrderStatusKey(lookupResult.status))
      : lookupResult.status
    : '';

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedOrderNumber = orderNumber.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedOrderNumber || !trimmedEmail) {
      setLookupResult(null);
      setLookupMessage(t('validation.required'));
      return;
    }

    setIsLookingUp(true);
    setLookupMessage('');
    setLookupResult(null);
    setVerifiedEmail('');
    setCancelMessage(null);
    setCancelTarget(false);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setLookupMessage(t('checkout.errorConfig'));
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/lookup-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            order_number: trimmedOrderNumber,
            email: trimmedEmail,
          }),
        },
      );

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        setLookupMessage(t(lookupErrorKey(data?.error)));
        return;
      }

      if (!data?.order?.order_number) {
        setLookupMessage(t('orders.lookupGeneric'));
        return;
      }

      setLookupResult(data.order);
      setVerifiedEmail(trimmedEmail);
    } catch {
      setLookupMessage(t('orders.lookupNetwork'));
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!lookupResult) return;

    setIsCancelling(true);
    setCancelMessage(null);

    try {
      const result = await cancelOrder(lookupResult.order_number, verifiedEmail);
      setLookupResult((previous) => ({
        ...previous,
        status: result?.status || 'cancelled',
      }));
      setCancelTarget(false);
      setCancelMessage({
        type: 'success',
        text: t('orders.cancelSuccess'),
      });
    } catch (error) {
      setCancelMessage({
        type: 'error',
        text: t(cancelErrorKey(error?.code)),
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReset = () => {
    setOrderNumber('');
    setEmail('');
    setVerifiedEmail('');
    setLookupResult(null);
    setLookupMessage('');
    setCancelTarget(false);
    setCancelMessage(null);
    setSearchParams({}, { replace: true });
  };

  const totals = lookupResult?.totals;

  return (
    <div className="order-lookup-page">
      <PageMeta
        title={t('orders.guestLookupTitle')}
        description={t('orders.guestLookupDescription')}
      />
      <div className="container order-lookup-container">
        <header className="lookup-hero">
          <div>
            <p className="lookup-kicker">{t('orders.lookupKicker')}</p>
            <h1>{t('orders.guestLookupTitle')}</h1>
            <p>{t('orders.lookupHelp')}</p>
          </div>
          <Link to="/orders" className="lookup-back-link">
            {t('orders.backToHistory')}
          </Link>
        </header>

        <form className="lookup-form" onSubmit={handleSubmit} noValidate>
          <label className="lookup-field" htmlFor="orderNumber">
            <span>{t('orders.lookupOrderNumber')}</span>
            <input
              id="orderNumber"
              type="text"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="JK-20261020-0001"
              autoComplete="off"
              aria-label={t('orders.lookupOrderNumber')}
              required
            />
          </label>

          <label className="lookup-field" htmlFor="lookupEmail">
            <span>{t('orders.lookupEmail')}</span>
            <input
              id="lookupEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
              aria-label={t('orders.lookupEmail')}
              required
            />
          </label>

          <div className="lookup-actions">
            <Button
              variant="primary"
              size="large"
              type="submit"
              disabled={isLookingUp}
            >
              {isLookingUp ? t('orders.lookupLoading') : t('orders.lookupSubmit')}
            </Button>
            <Button
              variant="outline"
              size="large"
              type="button"
              onClick={handleReset}
              disabled={isLookingUp}
            >
              {t('orders.lookupReset')}
            </Button>
          </div>
        </form>

        {lookupMessage ? (
          <p className="lookup-message" role="alert">
            {lookupMessage}
          </p>
        ) : null}

        {lookupResult ? (
          <section className="lookup-result" aria-labelledby="lookup-result-title">
            <div className="lookup-result-header">
              <div>
                <p className="lookup-kicker">{t('orders.lookupResults')}</p>
                <h2
                  id="lookup-result-title"
                  ref={resultHeadingRef}
                  tabIndex={-1}
                >
                  {lookupResult.order_number}
                </h2>
                {formatDateTime(lookupResult.created_at) ? (
                  <p className="lookup-created">
                    {t('orders.createdAt')}:{' '}
                    {formatDateTime(lookupResult.created_at)}
                  </p>
                ) : null}
              </div>
              <span className={`lookup-status status-${lookupResult.status}`}>
                {statusLabel}
              </span>
            </div>

            <div className="lookup-timeline">
              <h3>{t('orders.timeline')}</h3>
              <OrderTimeline
                order={{
                  status: lookupResult.status,
                  orderDate: lookupResult.created_at,
                  paidAt: lookupResult.paid_at,
                  shippedAt: lookupResult.shipped_at,
                  deliveredAt: lookupResult.delivered_at,
                  courier: lookupResult.courier,
                  trackingNumber: lookupResult.tracking_number,
                }}
              />
              {lookupResult.status === 'pending_payment' &&
              formatDateTime(lookupResult.expires_at) ? (
                <p className="lookup-deadline">
                  {t('orders.expiresAt')}:{' '}
                  {formatDateTime(lookupResult.expires_at)}
                </p>
              ) : null}
            </div>

            <div className="lookup-grid">
              <article className="lookup-items-card">
                <h3>{t('orders.lookupItems')}</h3>
                <ul className="lookup-items">
                  {(lookupResult.items ?? []).map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      <span>
                        {item.name} × {item.qty}
                      </span>
                      <strong>
                        {formatCurrency(item.unit_price_idr * item.qty)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </article>

              <article>
                <h3>{t('orders.lookupTotals')}</h3>
                <dl className="lookup-totals">
                  <div>
                    <dt>{t('orders.subtotal')}</dt>
                    <dd>{formatCurrency(totals?.subtotal_idr ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>{t('orders.shipping')}</dt>
                    <dd>{formatCurrency(totals?.shipping_idr ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>{t('orders.discount')}</dt>
                    <dd>{formatCurrency(totals?.discount_idr ?? 0)}</dd>
                  </div>
                  {totals?.tax_mode === 'excluded' ? (
                    <div>
                      <dt>{t('orders.tax')}</dt>
                      <dd>{formatCurrency(totals.tax_idr ?? 0)}</dd>
                    </div>
                  ) : null}
                  <div className="is-total">
                    <dt>{t('orders.total')}</dt>
                    <dd>{formatCurrency(totals?.total_idr ?? 0)}</dd>
                  </div>
                </dl>
                {totals?.tax_mode === 'included' ? (
                  <p className="lookup-tax-note">
                    {t('checkout.taxIncludedNote')}
                  </p>
                ) : null}
              </article>

            </div>

            {isCancellableStatus(lookupResult.status) ? (
              <div className="lookup-cancel">
                {cancelTarget ? (
                  <div className="lookup-cancel-confirm">
                    <h3 ref={cancelHeadingRef} tabIndex={-1}>
                      {t('orders.cancelConfirmTitle')}
                    </h3>
                    <p>{t('orders.cancelConfirmBody')}</p>
                    <p className="lookup-cancel-note">
                      {t('orders.cancelEmailNote')}
                    </p>
                    <div className="lookup-actions">
                      <Button
                        type="button"
                        className="lookup-cancel-danger"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? t('orders.cancelProcessing')
                          : t('orders.cancelConfirmYes')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeCancel}
                        disabled={isCancelling}
                      >
                        {t('orders.cancelConfirmNo')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-medium"
                    ref={cancelTriggerRef}
                    onClick={() => setCancelTarget(true)}
                  >
                    {t('orders.cancelOrder')}
                  </button>
                )}
              </div>
            ) : null}

            {cancelMessage ? (
              <p
                className={
                  cancelMessage.type === 'error'
                    ? 'lookup-cancel-message is-error'
                    : 'lookup-cancel-message is-success'
                }
                role={cancelMessage.type === 'error' ? 'alert' : 'status'}
              >
                {cancelMessage.text}
              </p>
            ) : null}

            <div className="lookup-footer-actions">
              <Link to="/shop" className="btn btn-outline btn-medium">
                {t('cart.continueShopping')}
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default OrderLookup;
