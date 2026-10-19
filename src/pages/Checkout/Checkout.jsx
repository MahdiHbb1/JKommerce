import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button/Button';
import { formatPrice } from '../../data/products';
import PageMeta from '../../components/Seo/PageMeta';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { t, formatCurrency } = useTranslation();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [shippingCost, setShippingCost] = useState(25000);
  const [isShippingQuoteLoading, setIsShippingQuoteLoading] = useState(false);
  const [shippingQuoteMessage, setShippingQuoteMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;

  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('xendit-invoice');
  const [formErrors, setFormErrors] = useState({});

  // Redirect if cart is empty (but not after order is confirmed)
  useEffect(() => {
    if (cart && cart.length === 0 && !orderConfirmed) {
      navigate('/cart');
    }
  }, [cart, navigate, orderConfirmed]);

  // Calculate totals (with safe defaults)
  const subtotal = cart ? getTotalPrice() : 0;
  const taxRate = 0.11; // 11% PPN
  const tax = subtotal * taxRate;
  const summaryItemCount = cart ? cart.reduce((count, item) => count + item.quantity, 0) : 0;
  const xenditSuccessUrl = import.meta.env.VITE_XENDIT_SUCCESS_REDIRECT_URL;
  const xenditFailureUrl = import.meta.env.VITE_XENDIT_FAILURE_REDIRECT_URL;
  const shippingQuoteEndpoint = import.meta.env.VITE_SHIPPING_QUOTE_ENDPOINT;
  const isXenditConfigured = Boolean(xenditSuccessUrl && xenditFailureUrl);
  const isShippingQuoteConfigured = Boolean(shippingQuoteEndpoint);
  const voucherCatalog = {
    BATIK10: { type: 'percent', value: 10 },
    JKM50: { type: 'fixed', value: 50000 },
    HEMAT25: { type: 'fixed', value: 25000 }
  };

  const discountAmount = appliedVoucher
    ? appliedVoucher.type === 'percent'
      ? Math.round(subtotal * (appliedVoucher.value / 100))
      : appliedVoucher.value
    : 0;
  const total = Math.max(subtotal + tax + shippingCost - discountAmount, 0);

  const generateOrderNumber = () => {
    const randomSource = typeof crypto !== 'undefined' ? crypto : window.crypto;

    if (randomSource?.randomUUID) {
      return `JK-${randomSource.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    }

    if (randomSource?.getRandomValues) {
      const values = new Uint8Array(8);
      randomSource.getRandomValues(values);
      return `JK-${Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
    }

    return `JK-${Date.now().toString(36).toUpperCase()}`;
  };

  const finalizePaidOrder = (orderNum, paymentState = 'processing') => {
    const orderData = {
      orderNumber: orderNum,
      items: cart,
      shippingInfo,
      paymentMethod: 'xendit-invoice',
      subtotal,
      tax,
      shipping: shippingCost,
      discountCode: appliedVoucher ? appliedVoucher.code : null,
      discountAmount,
      total,
      orderDate: Date.now(),
      status: paymentState
    };

    addOrder(orderData);
    setOrderNumber(orderNum);
    setOrderConfirmed(true);

    setTimeout(() => {
      clearCart();
    }, 500);
  };

  const resolveShippingCost = async () => {
    if (!isShippingQuoteConfigured) {
      setShippingCost(25000);
      setShippingQuoteMessage(t('checkout.shippingQuoteFallback'));
      return;
    }

    setIsShippingQuoteLoading(true);
    setShippingQuoteMessage('');

    try {
      const response = await fetch(shippingQuoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_city: shippingInfo.city,
          destination_province: shippingInfo.province,
          postal_code: shippingInfo.postalCode,
          subtotal
        })
      });

      if (!response.ok) {
        throw new Error('Shipping quote request failed');
      }

      const data = await response.json();
      const quotedCost = Number(data?.shippingCost ?? data?.cost ?? data?.price);

      if (!Number.isFinite(quotedCost) || quotedCost < 0) {
        throw new Error('Shipping quote response was invalid');
      }

      setShippingCost(quotedCost);
      setShippingQuoteMessage(t('checkout.shippingQuoteReady'));
    } catch (error) {
      setShippingCost(25000);
      setShippingQuoteMessage(t('checkout.shippingQuoteUnavailable'));
    } finally {
      setIsShippingQuoteLoading(false);
    }
  };


  // Validate shipping form
  const validateShippingInfo = () => {
    const errors = {};
    
    if (!shippingInfo.fullName.trim()) errors.fullName = t('validation.required');
    if (!shippingInfo.email.trim()) {
      errors.email = t('validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = t('validation.emailInvalid');
    }
    if (!shippingInfo.phone.trim()) {
      errors.phone = t('validation.required');
    } else if (!/^[0-9]{10,13}$/.test(shippingInfo.phone.replace(/[-\s]/g, ''))) {
      errors.phone = t('validation.invalidPhone');
    }
    if (!shippingInfo.address.trim()) errors.address = t('validation.required');
    if (!shippingInfo.city.trim()) errors.city = t('validation.required');
    if (!shippingInfo.province.trim()) errors.province = t('validation.required');
    if (!shippingInfo.postalCode.trim()) {
      errors.postalCode = t('validation.required');
    } else if (!/^[0-9]{5}$/.test(shippingInfo.postalCode)) {
      errors.postalCode = 'Kode pos harus 5 digit';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Navigate to next step
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (validateShippingInfo()) {
        await resolveShippingCost();
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleApplyVoucher = () => {
    const normalizedCode = voucherCode.trim().toUpperCase();
    const matchedVoucher = voucherCatalog[normalizedCode];

    if (!matchedVoucher) {
      setAppliedVoucher(null);
      toast.error(t('checkout.invalidVoucher'));
      return;
    }

    setAppliedVoucher({ code: normalizedCode, ...matchedVoucher });
    toast.success(t('checkout.voucherApplied', { code: normalizedCode }));
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setAppliedVoucher(null);
  };

  const buildWhatsAppMessage = (referenceNumber) => {
    const lines = [
      'Halo, saya ingin memesan batik melalui WhatsApp.',
      `Referensi: ${referenceNumber}`,
      '',
      'Ringkasan pesanan:'
    ];

    (cart || []).forEach((item) => {
      const variantParts = [];
      if (item.selectedSize) variantParts.push(`Size ${item.selectedSize}`);
      if (item.selectedColor) variantParts.push(`Color ${item.selectedColor}`);

      lines.push(`- ${item.name} x ${item.quantity}${variantParts.length ? ` (${variantParts.join(', ')})` : ''}`);
    });

    lines.push(
      '',
      `Subtotal: ${formatPrice(subtotal)}`,
      `Pajak: ${formatPrice(tax)}`,
      `Ongkir: ${shippingCost === 0 ? t('cart.freeShipping') : formatPrice(shippingCost)}`
    );

    if (discountAmount > 0) {
      lines.push(`Diskon: -${formatPrice(discountAmount)}`);
    }

    lines.push(`Total: ${formatPrice(total)}`);
    lines.push('', `Nama: ${shippingInfo.fullName}`, `Email: ${shippingInfo.email}`, `Phone: ${shippingInfo.phone}`);

    return lines.join('\n');
  };

  const handleWhatsAppFallback = () => {
    if (!whatsappNumber) {
      toast.error(t('checkout.whatsappUnavailable'));
      return;
    }

    const referenceNumber = orderNumber || generateOrderNumber();
    const encodedMessage = encodeURIComponent(buildWhatsAppMessage(referenceNumber));
    const normalizedNumber = whatsappNumber.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!isXenditConfigured) {
      toast.error(t('checkout.paymentGatewayUnavailable'));
      return;
    }

    try {
      setIsSubmittingPayment(true);

      const orderNum = generateOrderNumber();
      
      // Create order in local state first
      finalizePaidOrder(orderNum, 'processing');

      // Call Xendit create-invoice Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          order_number: orderNum,
          amount: Math.round(total),
          payer_email: shippingInfo.email,
          items: (cart || []).map((item) => ({
            name: item.name.slice(0, 50),
            quantity: item.quantity,
            price: Math.round(item.price)
          })),
          success_redirect_url: xenditSuccessUrl,
          failure_redirect_url: xenditFailureUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment invoice');
      }

      const data = await response.json();
      if (!data?.invoice_url) {
        throw new Error('Invoice URL not returned');
      }

      // Redirect to Xendit payment page
      window.location.href = data.invoice_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
      setIsSubmittingPayment(false);
    }
  };

  // Helper function for payment method names
  const getPaymentMethodName = (method) => {
    const methods = {
      'xendit-invoice': t('checkout.xenditInvoice')
    };
    return methods[method] || method;
  };

  // Render payment instructions based on selected method
  const renderPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'xendit-invoice':
        return (
          <div className="instructions-content">
            <p>{t('checkout.redirectingToPayment')}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Order Confirmation View
  if (orderConfirmed) {
    return (
      <div className="checkout-page">
        <PageMeta
          title="Order confirmed"
          description="Your batik order has been placed successfully."
        />
        <div className="container">
          <div className="order-confirmation">
            <div className="confirmation-icon">✓</div>
            <h1>{t('checkout.orderSuccess')}</h1>
            <p className="confirmation-message">
              {t('checkout.thankYou')}
            </p>
            
            <div className="order-details-box">
              <div className="order-detail-row">
                <span>{t('checkout.orderNumber')}:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div className="order-detail-row">
                <span>{t('cart.total')}:</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
              <div className="order-detail-row">
                <span>{t('checkout.paymentMethod')}:</span>
                <strong>{getPaymentMethodName(paymentMethod)}</strong>
              </div>
              <div className="order-detail-row">
                <span>Estimasi Pengiriman:</span>
                <strong>3-5 Hari Kerja</strong>
              </div>
            </div>

            <div className="payment-instructions">
              <h3>Instruksi Pembayaran</h3>
              {renderPaymentInstructions()}
            </div>

            <div className="confirmation-actions">
              <Button variant="primary" size="large" onClick={() => navigate('/')}>
                {t('cart.continueShopping')}
              </Button>
              <Button variant="outline" size="large" onClick={() => window.print()}>
                Cetak Detail Pesanan
              </Button>
              <Button variant="outline" size="large" onClick={handleWhatsAppFallback}>
                {t('checkout.whatsappFallback')}
              </Button>
            </div>
            <p className="confirmation-note">{t('checkout.whatsappFallbackNote')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main Checkout View
  return (
    <div className="checkout-page">
      <PageMeta
        title="Checkout"
        description="Complete your order securely with delivery details, shipping quote, and payment options."
      />
      <div className="container">
        <h1 className="checkout-title">{t('checkout.title')}</h1>

        {/* Progress Steps */}
        <div className="checkout-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">{t('checkout.step1')}</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">{t('checkout.step2')}</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">{t('checkout.step3')}</div>
          </div>
        </div>

        <div className="checkout-content">
          {/* Left Column - Forms */}
          <div className="checkout-main">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="checkout-section">
                <h2>{t('checkout.shippingInfo')}</h2>
                <form className="checkout-form">
                  <div className="form-group">
                    <label htmlFor="fullName">{t('checkout.fullName')} *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleInputChange}
                      autoComplete="name"
                      className={formErrors.fullName ? 'error' : ''}
                    />
                    {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">{t('checkout.email')} *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        autoComplete="email"
                        className={formErrors.email ? 'error' : ''}
                      />
                      {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">{t('checkout.phone')} *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        placeholder="08123456789"
                        autoComplete="tel"
                        inputMode="tel"
                        className={formErrors.phone ? 'error' : ''}
                      />
                      {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">{t('checkout.address')} *</label>
                    <textarea
                      id="address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      rows="3"
                      autoComplete="street-address"
                      className={formErrors.address ? 'error' : ''}
                    />
                    {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">{t('checkout.city')} *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        autoComplete="address-level2"
                        className={formErrors.city ? 'error' : ''}
                      />
                      {formErrors.city && <span className="error-message">{formErrors.city}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="province">{t('checkout.province')} *</label>
                      <input
                        type="text"
                        id="province"
                        name="province"
                        value={shippingInfo.province}
                        onChange={handleInputChange}
                        autoComplete="address-level1"
                        className={formErrors.province ? 'error' : ''}
                      />
                      {formErrors.province && <span className="error-message">{formErrors.province}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode">{t('checkout.postalCode')} *</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        placeholder="12345"
                        maxLength="5"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        className={formErrors.postalCode ? 'error' : ''}
                      />
                      {formErrors.postalCode && <span className="error-message">{formErrors.postalCode}</span>}
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="checkout-section">
                <h2>{t('checkout.paymentMethod')}</h2>
                <div className="payment-gateway-card">
                  <div className="payment-info">
                    <strong>{t('checkout.snapSandboxTitle')}</strong>
                    <span>{t('checkout.snapSandboxDesc')}</span>
                  </div>
                  <div className="payment-gateway-actions">
                    <Button
                      variant="outline"
                      size="large"
                      onClick={() => setCurrentStep(3)}
                    >
                      {t('checkout.continue')}
                    </Button>
                  </div>
                </div>
                <div className="voucher-panel">
                  <div className="voucher-row">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder={t('checkout.voucherCode')}
                      aria-label={t('checkout.voucherCode')}
                      autoComplete="off"
                    />
                    <Button variant="outline" size="large" onClick={handleApplyVoucher}>
                      {t('checkout.applyVoucher')}
                    </Button>
                  </div>
                  {appliedVoucher && (
                    <div className="voucher-active">
                      <span>{appliedVoucher.code}</span>
                      <button type="button" className="voucher-remove" onClick={handleRemoveVoucher}>
                        {t('checkout.removeVoucher')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <div className="checkout-section">
                <h2>{t('checkout.orderReview')}</h2>
                
                <div className="review-section">
                  <h3>Shipping Address</h3>
                  <div className="review-info">
                    <p><strong>{shippingInfo.fullName}</strong></p>
                    <p>{shippingInfo.address}</p>
                    <p>{shippingInfo.city}, {shippingInfo.province} {shippingInfo.postalCode}</p>
                    <p>Phone: {shippingInfo.phone}</p>
                    <p>Email: {shippingInfo.email}</p>
                  </div>
                  <button 
                    className="edit-link"
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit
                  </button>
                </div>

                <div className="review-section">
                  <h3>Payment Method</h3>
                  <div className="review-info">
                    <p><strong>{getPaymentMethodName(paymentMethod)}</strong></p>
                  </div>
                  <button 
                    className="edit-link"
                    onClick={() => setCurrentStep(2)}
                  >
                    Edit
                  </button>
                </div>

                <div className="review-section">
                  <h3>Order Items</h3>
                  <div className="review-items">
                    {cart && cart.map((item) => (
                      <div key={item.cartItemId} className="review-item">
                        <img src={item.images?.[0] || item.image} alt={item.name} />
                        <div className="review-item-details">
                          <h4>{item.name}</h4>
                          <p>Size: {item.selectedSize} | Color: {item.selectedColor}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                        <div className="review-item-price">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="checkout-actions">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  size="large"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  {t('checkout.back')}
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleNextStep}
                >
                  {t('checkout.continue')}
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={handlePlaceOrder}
                    disabled={isSubmittingPayment}
                  >
                    {isSubmittingPayment ? t('checkout.processing') : t('checkout.placeOrder')}
                  </Button>
                  <Button
                    variant="outline"
                    size="large"
                    onClick={handleWhatsAppFallback}
                  >
                    {t('checkout.whatsappFallback')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className={`checkout-sidebar ${isSummaryExpanded ? 'is-expanded' : ''}`}>
            <div className="order-summary">
              <button
                type="button"
                className="order-summary-toggle"
                onClick={() => setIsSummaryExpanded(prev => !prev)}
                aria-expanded={isSummaryExpanded}
                aria-label={isSummaryExpanded ? t('checkout.hideSummary') : t('checkout.showSummary')}
              >
                <div className="order-summary-toggle-copy">
                  <h3>{t('checkout.orderSummary')}</h3>
                  <span className="order-summary-count">{summaryItemCount}</span>
                </div>
                <div className="order-summary-toggle-meta">
                  <span>{formatPrice(total)}</span>
                  <span className="order-summary-toggle-icon">{isSummaryExpanded ? '−' : '+'}</span>
                </div>
              </button>

              <div className="order-summary-content">
                <div className="summary-items">
                  {cart && cart.map((item) => (
                    <div key={item.cartItemId} className="summary-item">
                      <span className="item-name">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>{t('cart.tax')}</span>
                  <span>{formatPrice(tax)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row">
                    <span>{t('checkout.voucherDiscount')}</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>{t('cart.shipping')}</span>
                  <span>{shippingCost === 0 ? t('cart.freeShipping') : formatPrice(shippingCost)}</span>
                </div>

                {(isShippingQuoteLoading || shippingQuoteMessage) && (
                  <p className="shipping-quote-note">
                    {isShippingQuoteLoading ? t('common.loading') : shippingQuoteMessage}
                  </p>
                )}

                {subtotal >= 1000000 && (
                  <div className="free-shipping-note">
                    {t('cart.freeShippingNotice')}
                  </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-total">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
