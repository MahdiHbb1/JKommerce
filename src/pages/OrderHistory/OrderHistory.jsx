import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { useTranslation } from '../../hooks/useTranslation';
import PageMeta from '../../components/Seo/PageMeta';
import Button from '../../components/Button/Button';
import OrderTimeline, {
  getOrderStatusKey,
  isCancellableStatus,
} from '../../components/OrderTimeline/OrderTimeline';
import './OrderHistory.css';

const orderAmount = (order, key) =>
  order?.[key] ?? order?.totals?.[`${key}_idr`] ?? 0;

const cancelErrorKey = (code) => {
  if (code === 'invalid_status') return 'orders.cancelErrorInvalidStatus';
  if (code === 'order_not_found') return 'orders.cancelErrorNotFound';
  if (code === 'rate_limited') return 'orders.cancelErrorRate';
  return 'orders.cancelErrorGeneric';
};

const OrderHistory = () => {
  const {
    orders,
    ordersLoading,
    ordersError,
    refreshOrders,
    cancelOrder,
  } = useOrders();
  const { t, formatCurrency, formatDate } = useTranslation();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [cancelMessage, setCancelMessage] = useState(null);
  const cancelHeadingRef = useRef(null);
  const cancelTriggerRefs = useRef(new Map());

  useEffect(() => {
    if (cancelTarget) {
      cancelHeadingRef.current?.focus();
    }
  }, [cancelTarget]);

  useEffect(() => {
    if (!cancelTarget) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !cancellingOrder) {
        const orderNumber = cancelTarget;
        setCancelTarget(null);
        window.setTimeout(() => {
          cancelTriggerRefs.current.get(orderNumber)?.focus();
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cancelTarget, cancellingOrder]);

  const closeCancel = (orderNumber) => {
    setCancelTarget(null);
    window.setTimeout(() => {
      cancelTriggerRefs.current.get(orderNumber)?.focus();
    }, 0);
  };

  const safeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : formatDate(date);
  };

  const statusLabel = (status) => {
    const key = getOrderStatusKey(status);
    return key ? t(key) : status;
  };

  const handleConfirmCancel = async (order) => {
    setCancellingOrder(order.orderNumber);
    setCancelMessage(null);

    try {
      const result = await cancelOrder(order.orderNumber, order.email);
      const nextStatus = result?.status || 'cancelled';
      setStatusOverrides((previous) => ({
        ...previous,
        [order.orderNumber]: nextStatus,
      }));
      setCancelTarget(null);
      setCancelMessage({
        orderNumber: order.orderNumber,
        type: 'success',
        text: t('orders.cancelSuccess'),
      });
    } catch (error) {
      setCancelMessage({
        orderNumber: order.orderNumber,
        type: 'error',
        text: t(cancelErrorKey(error?.code)),
      });
    } finally {
      setCancellingOrder(null);
    }
  };

  const renderEmpty = () => (
    <div className="order-empty">
      <h2>{t('orders.empty')}</h2>
      <p>{t('orders.emptyMessage')}</p>
      <div className="order-empty-actions">
        <Link to="/shop" className="btn btn-secondary btn-medium">
          {t('home.shopNow')}
        </Link>
        <Link to="/order-lookup" className="btn btn-outline btn-medium">
          {t('orders.guestLookupCta')}
        </Link>
      </div>
    </div>
  );

  const renderOrder = (order) => {
    const orderNumber = order.orderNumber || order.id;
    const status = statusOverrides[orderNumber] || order.status;
    const displayOrder = { ...order, status };
    const detailsId = `order-details-${order.id || orderNumber}`;
    const isExpanded = expandedOrder === orderNumber;
    const items = Array.isArray(order.items) ? order.items : [];
    const shippingInfo = order.shippingInfo || {};
    const hasAddress = Boolean(
      shippingInfo.address ||
        shippingInfo.city ||
        shippingInfo.province ||
        shippingInfo.postalCode,
    );
    const messageForOrder =
      cancelMessage?.orderNumber === orderNumber ? cancelMessage : null;
    const isCancelling = cancellingOrder === orderNumber;

    return (
      <article className="order-card" key={order.id || orderNumber}>
        <div className="order-card-head">
          <div className="order-card-identity">
            <p className="order-card-number">{orderNumber}</p>
            <p className="order-card-meta">
              {safeDate(order.orderDate) || t('orders.createdAt')}{' '}
              <span aria-hidden="true">·</span>{' '}
              {t('orders.itemsCount', {
                count: items.length,
                suffix: items.length === 1 ? '' : 's',
              })}
            </p>
          </div>

          <div className="order-card-side">
            <span className={`order-status status-${status}`}>
              {statusLabel(status)}
            </span>
            <span className="order-card-total">
              {formatCurrency(orderAmount(order, 'total'))}
            </span>
          </div>

          <button
            type="button"
            className="order-expand"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            aria-label={t('orders.detailsAria', { number: orderNumber })}
            onClick={() =>
              setExpandedOrder(isExpanded ? null : orderNumber)
            }
          >
            <span>{isExpanded ? t('orders.hideDetails') : t('orders.viewDetails')}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={isExpanded ? 'is-rotated' : ''}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {isExpanded ? (
          <div className="order-details" id={detailsId}>
            <section className="order-detail-section">
              <h2>{t('orders.timeline')}</h2>
              <OrderTimeline order={displayOrder} />
              {status === 'pending_payment' && safeDate(order.expiresAt) ? (
                <p className="order-expiry-note">
                  {t('orders.expiresAt')}: {safeDate(order.expiresAt)}
                </p>
              ) : null}
            </section>

            <section className="order-detail-section">
              <h2>{t('orders.orderItems')}</h2>
              {items.length > 0 ? (
                <ul className="order-history-items">
                  {items.map((item, index) => {
                    const quantity = item.quantity ?? item.qty ?? 0;
                    const price = item.price ?? item.unit_price_idr ?? 0;
                    return (
                      <li key={`${item.name}-${index}`}>
                        <div className="order-history-item-main">
                          <span className="order-history-item-name">
                            {item.name}
                          </span>
                          <span className="order-history-item-meta">
                            {[item.selectedSize, item.selectedColor]
                              .filter(Boolean)
                              .join(' · ')}
                            {item.selectedSize || item.selectedColor
                              ? ' · '
                              : ''}
                            {quantity}×
                          </span>
                        </div>
                        <span className="order-history-item-price">
                          {formatCurrency(price * quantity)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="order-muted">
                  {t('orders.noItems')}{' '}
                  <Link to="/order-lookup">{t('orders.openLookup')}</Link>
                </p>
              )}
            </section>

            <div className="order-info-grid">
              {hasAddress ? (
                <section className="order-info-section">
                  <h2>{t('orders.shippingAddress')}</h2>
                  {shippingInfo.fullName ? <p>{shippingInfo.fullName}</p> : null}
                  {shippingInfo.phone ? <p>{shippingInfo.phone}</p> : null}
                  {shippingInfo.address ? <p>{shippingInfo.address}</p> : null}
                  <p>
                    {[shippingInfo.city, shippingInfo.province]
                      .filter(Boolean)
                      .join(', ')}{' '}
                    {shippingInfo.postalCode || ''}
                  </p>
                </section>
              ) : null}

              <section className="order-info-section">
                <h2>{t('orders.paymentMethodLabel')}</h2>
                <p>
                  {order.paymentMethod === 'duitku'
                    ? 'Duitku'
                    : t('orders.paymentManual')}
                </p>
              </section>

              <section className="order-info-section order-info-totals">
                <h2>{t('checkout.orderSummary')}</h2>
                <div className="order-total-row">
                  <span>{t('orders.subtotal')}</span>
                  <span>{formatCurrency(orderAmount(order, 'subtotal'))}</span>
                </div>
                <div className="order-total-row">
                  <span>{t('orders.shipping')}</span>
                  <span>{formatCurrency(orderAmount(order, 'shipping'))}</span>
                </div>
                <div className="order-total-row">
                  <span>{t('orders.discount')}</span>
                  <span>{formatCurrency(orderAmount(order, 'discount'))}</span>
                </div>
                {order.taxMode === 'excluded' ? (
                  <div className="order-total-row">
                    <span>{t('orders.tax')}</span>
                    <span>{formatCurrency(orderAmount(order, 'tax'))}</span>
                  </div>
                ) : null}
                <div className="order-total-row is-final">
                  <span>{t('orders.total')}</span>
                  <span>{formatCurrency(orderAmount(order, 'total'))}</span>
                </div>
                {order.taxMode === 'included' ? (
                  <p className="order-muted">
                    {t('checkout.taxIncludedNote')}
                  </p>
                ) : null}
              </section>
            </div>

            {isCancellableStatus(status) && order.email ? (
              <section className="order-cancel" aria-label={t('orders.cancelOrder')}>
                {cancelTarget === orderNumber ? (
                  <div className="order-cancel-confirm">
                    <h2 ref={cancelHeadingRef} tabIndex={-1}>
                      {t('orders.cancelConfirmTitle')}
                    </h2>
                    <p>{t('orders.cancelConfirmBody')}</p>
                    <p className="order-muted">{t('orders.cancelEmailNote')}</p>
                    <div className="order-cancel-actions">
                      <Button
                        type="button"
                        className="order-cancel-danger"
                        onClick={() => handleConfirmCancel(order)}
                        disabled={isCancelling}
                      >
                        {isCancelling
                          ? t('orders.cancelProcessing')
                          : t('orders.cancelConfirmYes')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => closeCancel(orderNumber)}
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
                    ref={(node) => {
                      if (node) {
                        cancelTriggerRefs.current.set(orderNumber, node);
                      } else {
                        cancelTriggerRefs.current.delete(orderNumber);
                      }
                    }}
                    onClick={() => setCancelTarget(orderNumber)}
                  >
                    {t('orders.cancelOrder')}
                  </button>
                )}
              </section>
            ) : null}

            {messageForOrder ? (
              <p
                className={
                  messageForOrder.type === 'error'
                    ? 'order-cancel-message is-error'
                    : 'order-cancel-message is-success'
                }
                role={messageForOrder.type === 'error' ? 'alert' : 'status'}
              >
                {messageForOrder.text}
              </p>
            ) : null}

            <div className="order-actions">
              <Link
                to={`/order-lookup?order=${encodeURIComponent(orderNumber)}`}
                state={{ email: order.email }}
                className="btn btn-outline btn-medium"
              >
                {t('orders.trackOrder')}
              </Link>
              <Link to="/shop" className="btn btn-outline btn-medium">
                {t('cart.continueShopping')}
              </Link>
            </div>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="order-history-page">
      <PageMeta title={t('orders.orderHistory')} description={t('orders.historyLead')} />
      <div className="container order-history-container">
        <header className="order-history-header">
          <h1>{t('orders.orderHistory')}</h1>
          <p>{t('orders.historyLead')}</p>
          <Link to="/order-lookup" className="order-lookup-link">
            {t('orders.guestLookupCta')}
          </Link>
        </header>

        {ordersLoading && orders.length === 0 ? (
          <p className="order-state" role="status">
            {t('orders.loadingOrders')}
          </p>
        ) : null}

        {ordersError ? (
          <div className="order-state order-state-error" role="alert">
            <p>
              <strong>{t('orders.loadOrdersError')}</strong>{' '}
              {t('orders.loadOrdersErrorBody')}
            </p>
            <Button type="button" variant="outline" onClick={refreshOrders}>
              {t('orders.retry')}
            </Button>
          </div>
        ) : null}

        {!ordersLoading && !ordersError && orders.length === 0
          ? renderEmpty()
          : null}

        {orders.length > 0 ? (
          <div className="orders-list">{orders.map(renderOrder)}</div>
        ) : null}
      </div>
    </div>
  );
};

export default OrderHistory;
