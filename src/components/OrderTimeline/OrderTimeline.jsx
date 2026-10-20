import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './OrderTimeline.css';

const STEPS = [
  { status: 'pending_payment', labelKey: 'orders.stepPending', dateKey: 'orderDate' },
  { status: 'paid', labelKey: 'orders.stepPaid', dateKey: 'paidAt' },
  { status: 'packing', labelKey: 'orders.stepPacking', dateKey: null },
  { status: 'shipped', labelKey: 'orders.stepShipped', dateKey: 'shippedAt' },
  { status: 'delivered', labelKey: 'orders.stepDelivered', dateKey: 'deliveredAt' },
];

const STATUS_INDEX = {
  pending: 0,
  pending_payment: 0,
  paid: 1,
  processing: 2,
  packing: 2,
  shipped: 3,
  delivered: 4,
};

const TERMINAL_LABELS = {
  cancelled: 'orders.stepCancelled',
  expired: 'orders.stepExpired',
  refunded: 'orders.refunded',
};

export const getOrderStatusKey = (status) => {
  const keys = {
    pending: 'orders.pending',
    pending_payment: 'orders.pending',
    paid: 'orders.paid',
    processing: 'orders.packing',
    packing: 'orders.packing',
    shipped: 'orders.shipped',
    delivered: 'orders.delivered',
    cancelled: 'orders.cancelled',
    expired: 'orders.expired',
    refunded: 'orders.refunded',
  };
  return keys[status] ?? null;
};

export const isCancellableStatus = (status) => status === 'pending_payment';

const OrderTimeline = ({ order }) => {
  const { t, formatDate } = useTranslation();
  const status = order?.status;
  const currentIndex = STATUS_INDEX[status];
  const terminalKey = TERMINAL_LABELS[status];

  const safeDate = (value) => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return formatDate(date);
  };

  if (terminalKey) {
    return (
      <div className={`order-timeline-terminal status-${status}`}>
        <span className="timeline-terminal-label">{t(terminalKey)}</span>
      </div>
    );
  }

  return (
    <div className="order-timeline">
      <ol className="order-timeline-steps">
        {STEPS.map((step, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = currentIndex === index;
          const stateClass = isCurrent
            ? 'is-current'
            : isComplete
              ? 'is-complete'
              : 'is-upcoming';
          const dateValue = step.dateKey ? order?.[step.dateKey] : null;
          const dateLabel = safeDate(dateValue);

          return (
            <li
              key={step.status}
              className={`timeline-step ${stateClass}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="timeline-marker" aria-hidden="true">
                {index + 1}
              </span>
              <span className="timeline-label">{t(step.labelKey)}</span>
              {dateLabel ? (
                <time className="timeline-date" dateTime={dateValue}>
                  {dateLabel}
                </time>
              ) : (
                <span className="timeline-date timeline-date-empty" />
              )}
            </li>
          );
        })}
      </ol>

      {order?.courier || order?.trackingNumber ? (
        <dl className="order-timeline-shipping">
          {order.courier ? (
            <div>
              <dt>{t('orders.courier')}</dt>
              <dd>{order.courier}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t('orders.trackingNumber')}</dt>
            <dd>{order.trackingNumber || t('orders.trackingUnavailable')}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
};

export default OrderTimeline;
