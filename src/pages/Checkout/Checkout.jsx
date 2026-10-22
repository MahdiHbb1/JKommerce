import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import {
  fetchPublicSettings,
  fetchShippingZones,
} from '../../lib/db/catalog.js';
import { computeTotals } from '../../../supabase/functions/_shared/pricing';
import './Checkout.css';

// Versi kata persetujuan checkout. Ganti dengan versi dokumen legal yang
// terbit saat halaman Syarat & Ketentuan/Kebijakan Privasi tersedia.
const CONSENT_VERSION = '2026-10-19';

const EMPTY_SHIPPING_INFO = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
};

const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `jk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolveLegalVersion = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : CONSENT_VERSION;

const unitPriceOf = (item) => Number(item.price ?? item.price_idr ?? 0);

const scrollToCheckoutTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
  }
};

const FieldError = ({ id, message }) =>
  message ? (
    <span className="field-error" id={id}>
      {message}
    </span>
  ) : null;

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { t, formatCurrency } = useTranslation();

  const [currentStep, setCurrentStep] = useState(1);
  const [loadState, setLoadState] = useState('loading');
  const [retryToken, setRetryToken] = useState(0);
  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState(null);
  const [shippingInfo, setShippingInfo] = useState(EMPTY_SHIPPING_INFO);
  const [formErrors, setFormErrors] = useState({});
  const [consent, setConsent] = useState({ tos: false, privacy: false });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const idempotencyKeyRef = useRef('');
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    setLoadState('loading');
    setSubmitError('');

    Promise.all([fetchShippingZones(), fetchPublicSettings()])
      .then(([zoneRows, publicSettings]) => {
        if (cancelled) {
          return;
        }

        const mode = publicSettings?.tax?.mode;
        const rate = publicSettings?.tax?.rate_percent;
        const taxValid =
          ['included', 'excluded', 'none'].includes(mode) &&
          typeof rate === 'number' &&
          Number.isFinite(rate) &&
          rate >= 0 &&
          rate <= 100;

        if (!taxValid) {
          throw new Error('settings_invalid');
        }

        setZones(Array.isArray(zoneRows) ? zoneRows : []);
        setSettings(publicSettings);
        setLoadState('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error('Checkout: gagal memuat pengaturan toko', error);
        setLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  useEffect(() => {
    if (cart.length === 0 && !submittedRef.current) {
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  const provinceOptions = useMemo(() => {
    const provinceMap = new Map();

    zones.forEach((zone) => {
      const provinces = Array.isArray(zone.provinces) ? zone.provinces : [];
      provinces.forEach((province) => {
        if (
          typeof province === 'string' &&
          province.trim() &&
          !provinceMap.has(province)
        ) {
          provinceMap.set(province, zone);
        }
      });
    });

    return Array.from(provinceMap, ([province, zone]) => ({
      province,
      zone,
    }));
  }, [zones]);

  const selectedOption =
    provinceOptions.find(
      (option) => option.province === shippingInfo.province,
    ) || null;
  const selectedZone = selectedOption?.zone || null;
  const hasZones = provinceOptions.length > 0;
  const taxMode = settings?.tax?.mode || 'included';
  const taxRate = settings?.tax?.rate_percent ?? 0;

  const subtotal = cart.reduce(
    (sum, item) => sum + unitPriceOf(item) * Number(item.quantity),
    0,
  );
  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  let totals = null;
  if (selectedZone && cart.length > 0) {
    try {
      totals = computeTotals({
        lines: cart.map((item) => ({
          qty: Number(item.quantity),
          unit_price_idr: unitPriceOf(item),
        })),
        shipping_idr: selectedZone.rate_idr,
        discount_idr: 0,
        tax: { mode: taxMode, rate_percent: taxRate },
      });
    } catch (totalsError) {
      console.error('Checkout: total tidak dapat dihitung', totalsError);
      totals = null;
    }
  }

  const canSubmit =
    loadState === 'ready' &&
    hasZones &&
    Boolean(totals) &&
    consent.tos &&
    consent.privacy &&
    !isSubmitting;

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setShippingInfo((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => ({ ...previous, [name]: '' }));
  };

  const handleConsentChange = (event) => {
    const { name, checked } = event.target;
    setConsent((previous) => ({ ...previous, [name]: checked }));
  };

  const validateShippingInfo = () => {
    const errors = {};
    const fullName = shippingInfo.fullName.trim();
    const email = shippingInfo.email.trim();
    const phone = shippingInfo.phone.trim();
    const address = shippingInfo.address.trim();
    const city = shippingInfo.city.trim();
    const postalCode = shippingInfo.postalCode.trim();

    if (fullName.length < 2) {
      errors.fullName = t('validation.required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.email = t('validation.emailInvalid');
    }
    if (!/^[+]?[\d\s-]{9,18}$/.test(phone)) {
      errors.phone = t('validation.invalidPhone');
    }
    if (address.length < 10) {
      errors.address = t('validation.addressTooShort');
    }
    if (city.length < 2) {
      errors.city = t('validation.required');
    }
    if (!selectedOption) {
      errors.province = t('validation.provinceUnavailable');
    }
    if (!/^\d{5}$/.test(postalCode)) {
      errors.postalCode = t('validation.postalCode');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = (event) => {
    event.preventDefault();

    if (loadState !== 'ready' || !hasZones) {
      return;
    }
    if (!validateShippingInfo()) {
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createIdempotencyKey();
    }
    setSubmitError('');
    setCurrentStep(2);
    scrollToCheckoutTop();
  };

  const handleEditAddress = () => {
    idempotencyKeyRef.current = '';
    setSubmitError('');
    setCurrentStep(1);
    scrollToCheckoutTop();
  };

  const submitErrorMessage = (error) => {
    if (error?.code === 'insufficient_stock' || error?.status === 409) {
      return t('checkout.errorStock');
    }
    if (error?.code === 'shipping_unavailable') {
      return t('checkout.errorShipping');
    }
    if (error?.code === 'validation_failed') {
      return t('checkout.errorValidation');
    }
    if (error?.code === 'rate_limited' || error?.status === 429) {
      return t('checkout.errorRate');
    }
    if (error?.code === 'network_error') {
      return t('checkout.errorNetwork');
    }
    if (error?.code === 'supabase_not_configured') {
      return t('checkout.errorConfig');
    }
    return t('checkout.errorGeneric');
  };

  const handlePlaceOrder = async () => {
    if (!canSubmit) {
      return;
    }

    const missingVariant = cart.find((item) => !item.variantId);
    if (missingVariant) {
      setSubmitError(t('checkout.errorVariantMissing'));
      return;
    }

    const legal = settings?.legal || {};
    const payload = {
      items: cart.map((item) => ({
        variant_id: item.variantId,
        qty: Number(item.quantity),
      })),
      customer: {
        name: shippingInfo.fullName.trim(),
        email: shippingInfo.email.trim(),
        phone: shippingInfo.phone.trim(),
      },
      address: {
        recipient: shippingInfo.fullName.trim(),
        phone: shippingInfo.phone.trim(),
        full_address: shippingInfo.address.trim(),
        city: shippingInfo.city.trim(),
        province: shippingInfo.province,
        postal_code: shippingInfo.postalCode.trim(),
        country: 'ID',
      },
      payment_preference: 'manual',
      accepts: {
        tos: true,
        privacy: true,
        versions: {
          tos: resolveLegalVersion(legal.tos_version),
          privacy: resolveLegalVersion(legal.privacy_version),
        },
      },
      idempotency_key: idempotencyKeyRef.current,
    };

    const orderItemsSnapshot = cart.map((item) => ({
      name: item.name,
      qty: Number(item.quantity),
      unit_price_idr: unitPriceOf(item),
      size: item.selectedSize || null,
      color: item.selectedColor || null,
    }));

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const createdOrder = await createOrder(payload);
      submittedRef.current = true;
      clearCart();
      navigate('/order-received', {
        state: {
          order: createdOrder,
          items: orderItemsSnapshot,
          email: payload.customer.email,
        },
      });
    } catch (error) {
      console.error('Checkout: create-order gagal', error);
      setSubmitError(submitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSummaryItems = () => (
    <ul className="summary-items">
      {cart.map((item) => (
        <li key={item.cartItemId || `${item.id}-${item.selectedSize}-${item.selectedColor}`}>
          <div className="summary-item-main">
            <span className="summary-item-name">{item.name}</span>
            <span className="summary-item-meta">
              {[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}
              {item.selectedSize || item.selectedColor ? ' · ' : ''}
              {item.quantity}×
            </span>
          </div>
          <span className="summary-item-price">
            {formatCurrency(unitPriceOf(item) * Number(item.quantity))}
          </span>
        </li>
      ))}
    </ul>
  );

  const renderSummary = () => (
    <div className={`order-summary${isSummaryExpanded ? ' is-open' : ''}`}>
      <div className="summary-heading">
        <span>{t('checkout.orderSummary')}</span>
        <span className="summary-count">
          {itemCount} {t('checkout.itemsCount')}
        </span>
      </div>

      <button
        type="button"
        className="summary-toggle"
        aria-expanded={isSummaryExpanded}
        aria-controls="checkout-summary-body"
        onClick={() => setIsSummaryExpanded((previous) => !previous)}
      >
        <span>
          {t('checkout.orderSummary')}
          <span className="summary-count">
            {itemCount} {t('checkout.itemsCount')}
          </span>
        </span>
        <span className="summary-toggle-label">
          {isSummaryExpanded
            ? t('checkout.hideSummary')
            : t('checkout.showSummary')}
        </span>
      </button>

      <div className="summary-body" id="checkout-summary-body">
        {renderSummaryItems()}

        <dl className="summary-totals">
          <div className="summary-row">
            <dt>{t('checkout.subtotal')}</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="summary-row">
            <dt>
              {t('checkout.shipping')}
              {selectedZone ? (
                <span className="summary-row-note">{selectedZone.name}</span>
              ) : null}
            </dt>
            <dd>
              {selectedZone
                ? formatCurrency(selectedZone.rate_idr)
                : t('checkout.shippingNotChosen')}
            </dd>
          </div>
          <div className="summary-row">
            <dt>{t('checkout.discount')}</dt>
            <dd>{formatCurrency(totals?.discount_idr || 0)}</dd>
          </div>
          {taxMode === 'excluded' ? (
            <div className="summary-row">
              <dt>{t('checkout.taxLine', { rate: taxRate })}</dt>
              <dd>{totals ? formatCurrency(totals.tax_idr) : '-'}</dd>
            </div>
          ) : null}
          <div className="summary-row summary-row-total">
            <dt>{t('checkout.total')}</dt>
            <dd aria-live="polite">
              {totals
                ? formatCurrency(totals.total_idr)
                : t('checkout.totalPending')}
            </dd>
          </div>
        </dl>

        {taxMode === 'included' ? (
          <p className="summary-tax-note">{t('checkout.taxIncludedNote')}</p>
        ) : null}
        {selectedZone ? (
          <p className="summary-shipping-note">
            {selectedZone.eta_min_days && selectedZone.eta_max_days
              ? t('checkout.etaNote', {
                  min: selectedZone.eta_min_days,
                  max: selectedZone.eta_max_days,
                })
              : t('checkout.etaUnavailable')}
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      <PageMeta
        title={t('checkout.title')}
        description={t('checkout.metaDescription')}
        noIndex
      />

      <div className="container checkout-container">
        <header className="checkout-header">
          <p className="checkout-eyebrow">{t('checkout.eyebrow')}</p>
          <h1 className="checkout-title">{t('checkout.title')}</h1>
          <p className="checkout-lead">{t('checkout.lead')}</p>
        </header>

        <nav aria-label={t('checkout.progressLabel')}>
          <ol className="checkout-progress">
            <li
              className={currentStep === 1 ? 'is-current' : 'is-complete'}
              aria-current={currentStep === 1 ? 'step' : undefined}
            >
              <span className="step-number">1</span>
              <span className="step-label">{t('checkout.stepShipping')}</span>
            </li>
            <li
              className={currentStep === 2 ? 'is-current' : ''}
              aria-current={currentStep === 2 ? 'step' : undefined}
            >
              <span className="step-number">2</span>
              <span className="step-label">{t('checkout.stepConfirm')}</span>
            </li>
          </ol>
        </nav>

        {loadState === 'loading' ? (
          <div className="checkout-state" role="status">
            <p>{t('common.loading')}</p>
          </div>
        ) : null}

        {loadState === 'error' ? (
          <div className="checkout-state checkout-state-error" role="alert">
            <h2>{t('checkout.loadErrorTitle')}</h2>
            <p>{t('checkout.loadErrorBody')}</p>
            <Button
              variant="outline"
              onClick={() => setRetryToken((previous) => previous + 1)}
            >
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {loadState === 'ready' && !hasZones ? (
          <div className="checkout-notice" role="status">
            <strong>{t('checkout.zonesEmptyTitle')}</strong>
            <p>{t('checkout.zonesEmptyBody')}</p>
          </div>
        ) : null}

        {loadState === 'ready' ? (
          <div className="checkout-layout">
            <div className="checkout-main">
              {currentStep === 1 ? (
                <form className="checkout-form" onSubmit={handleContinue} noValidate>
                  <section
                    className="checkout-section"
                    aria-labelledby="contact-heading"
                  >
                    <div className="section-heading">
                      <h2 id="contact-heading">{t('checkout.contactSection')}</h2>
                      <p>{t('checkout.contactHint')}</p>
                    </div>

                    <div className="form-grid">
                      <div className="form-group form-group-full">
                        <label htmlFor="fullName">
                          {t('checkout.fullName')} *
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          autoComplete="name"
                          value={shippingInfo.fullName}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.fullName)}
                          aria-describedby={
                            formErrors.fullName ? 'fullName-error' : undefined
                          }
                        />
                        <FieldError
                          id="fullName-error"
                          message={formErrors.fullName}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">{t('checkout.email')} *</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={shippingInfo.email}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.email)}
                          aria-describedby={
                            formErrors.email ? 'email-error' : undefined
                          }
                        />
                        <FieldError id="email-error" message={formErrors.email} />
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">{t('checkout.phone')} *</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={shippingInfo.phone}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.phone)}
                          aria-describedby={
                            formErrors.phone ? 'phone-error' : undefined
                          }
                        />
                        <FieldError id="phone-error" message={formErrors.phone} />
                      </div>
                    </div>
                  </section>

                  <section
                    className="checkout-section"
                    aria-labelledby="shipping-heading"
                  >
                    <div className="section-heading">
                      <h2 id="shipping-heading">
                        {t('checkout.shippingSection')}
                      </h2>
                      <p>{t('checkout.shippingHint')}</p>
                    </div>

                    <div className="form-grid">
                      <div className="form-group form-group-full">
                        <label htmlFor="address">
                          {t('checkout.address')} *
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          rows="4"
                          autoComplete="street-address"
                          value={shippingInfo.address}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.address)}
                          aria-describedby={
                            formErrors.address ? 'address-error' : undefined
                          }
                        />
                        <FieldError
                          id="address-error"
                          message={formErrors.address}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="city">{t('checkout.city')} *</label>
                        <input
                          id="city"
                          name="city"
                          type="text"
                          autoComplete="address-level2"
                          value={shippingInfo.city}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.city)}
                          aria-describedby={
                            formErrors.city ? 'city-error' : undefined
                          }
                        />
                        <FieldError id="city-error" message={formErrors.city} />
                      </div>

                      <div className="form-group">
                        <label htmlFor="province">
                          {t('checkout.province')} *
                        </label>
                        <select
                          id="province"
                          name="province"
                          autoComplete="address-level1"
                          value={shippingInfo.province}
                          onChange={handleFieldChange}
                          disabled={!hasZones}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.province)}
                          aria-describedby={
                            formErrors.province ? 'province-error' : undefined
                          }
                        >
                          <option value="">
                            {hasZones
                              ? t('checkout.provincePlaceholder')
                              : t('checkout.zonesEmptyShort')}
                          </option>
                          {provinceOptions.map(({ province }) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                        <FieldError
                          id="province-error"
                          message={formErrors.province}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="postalCode">
                          {t('checkout.postalCode')} *
                        </label>
                        <input
                          id="postalCode"
                          name="postalCode"
                          type="text"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          value={shippingInfo.postalCode}
                          onChange={handleFieldChange}
                          aria-required="true"
                          aria-invalid={Boolean(formErrors.postalCode)}
                          aria-describedby={
                            formErrors.postalCode
                              ? 'postalCode-error'
                              : undefined
                          }
                        />
                        <FieldError
                          id="postalCode-error"
                          message={formErrors.postalCode}
                        />
                      </div>
                    </div>
                  </section>

                  <div className="checkout-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      size="large"
                      disabled={!hasZones}
                    >
                      {t('checkout.continueToConfirm')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="checkout-confirm">
                  <section
                    className="checkout-section"
                    aria-labelledby="confirm-address-heading"
                  >
                    <div className="section-heading section-heading-row">
                      <h2 id="confirm-address-heading">
                        {t('checkout.shippingSection')}
                      </h2>
                      <button
                        type="button"
                        className="link-button"
                        onClick={handleEditAddress}
                      >
                        {t('checkout.editAddress')}
                      </button>
                    </div>
                    <p className="confirm-name">{shippingInfo.fullName}</p>
                    <p className="confirm-meta">
                      {shippingInfo.phone} · {shippingInfo.email}
                    </p>
                    <p className="confirm-address">
                      {shippingInfo.address}
                      <br />
                      {shippingInfo.city}, {shippingInfo.province}{' '}
                      {shippingInfo.postalCode}
                    </p>
                  </section>

                  <section
                    className="checkout-section"
                    aria-labelledby="confirm-shipping-heading"
                  >
                    <div className="section-heading">
                      <h2 id="confirm-shipping-heading">
                        {t('checkout.shipping')}
                      </h2>
                    </div>
                    <p className="confirm-name">{selectedZone?.name}</p>
                    <p className="confirm-meta">
                      {formatCurrency(selectedZone?.rate_idr || 0)}
                      {selectedZone?.eta_min_days && selectedZone?.eta_max_days
                        ? ` · ${t('checkout.etaNote', {
                            min: selectedZone.eta_min_days,
                            max: selectedZone.eta_max_days,
                          })}`
                        : ''}
                    </p>
                  </section>

                  <section
                    className="checkout-section"
                    aria-labelledby="confirm-payment-heading"
                  >
                    <div className="section-heading">
                      <h2 id="confirm-payment-heading">
                        {t('checkout.paymentMethod')}
                      </h2>
                    </div>
                    <div className="payment-card">
                      <p className="payment-card-title">
                        {t('checkout.paymentManualTitle')}
                      </p>
                      <p className="payment-card-body">
                        {t('checkout.paymentManualDesc')}
                      </p>
                    </div>
                  </section>

                  <section
                    className="checkout-section"
                    aria-labelledby="confirm-items-heading"
                  >
                    <div className="section-heading">
                      <h2 id="confirm-items-heading">
                        {t('checkout.orderItems')}
                      </h2>
                    </div>
                    {renderSummaryItems()}
                  </section>

                  <section
                    className="checkout-section checkout-consent"
                    aria-labelledby="consent-heading"
                  >
                    <div className="section-heading">
                      <h2 id="consent-heading">
                        {t('checkout.consentTitle')}
                      </h2>
                    </div>

                    <label className="consent-row" htmlFor="consent-tos">
                      <input
                        id="consent-tos"
                        name="tos"
                        type="checkbox"
                        checked={consent.tos}
                        onChange={handleConsentChange}
                      />
                      <span>{t('checkout.consentTos')}</span>
                    </label>

                    <label className="consent-row" htmlFor="consent-privacy">
                      <input
                        id="consent-privacy"
                        name="privacy"
                        type="checkbox"
                        checked={consent.privacy}
                        onChange={handleConsentChange}
                      />
                      <span>{t('checkout.consentPrivacy')}</span>
                    </label>

                    <p className="consent-hint">{t('checkout.consentHint')}</p>
                  </section>

                  {submitError ? (
                    <p className="checkout-alert" role="alert">
                      {submitError}
                    </p>
                  ) : null}

                  <div className="checkout-actions">
                    <Button
                      variant="outline"
                      size="large"
                      onClick={handleEditAddress}
                      disabled={isSubmitting}
                    >
                      {t('checkout.back')}
                    </Button>
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handlePlaceOrder}
                      disabled={!canSubmit}
                    >
                      {isSubmitting
                        ? t('checkout.processing')
                        : t('checkout.placeOrder')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <aside className="checkout-sidebar">
              {renderSummary()}
              <p className="checkout-help">
                {t('checkout.helpText')}
              </p>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Checkout;
