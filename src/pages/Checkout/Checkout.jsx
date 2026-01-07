import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import Button from '../../components/Button/Button';
import { formatPrice } from '../../data/products';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

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

  const [paymentMethod, setPaymentMethod] = useState('');
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
  const shippingCost = subtotal >= 1000000 ? 0 : 25000; // Free shipping over 1M
  const total = subtotal + tax + shippingCost;

  // Validate shipping form
  const validateShippingInfo = () => {
    const errors = {};
    
    if (!shippingInfo.fullName.trim()) errors.fullName = 'Full name is required';
    if (!shippingInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingInfo.email)) {
      errors.email = 'Email is invalid';
    }
    if (!shippingInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,13}$/.test(shippingInfo.phone.replace(/[-\s]/g, ''))) {
      errors.phone = 'Phone number must be 10-13 digits';
    }
    if (!shippingInfo.address.trim()) errors.address = 'Address is required';
    if (!shippingInfo.city.trim()) errors.city = 'City is required';
    if (!shippingInfo.province.trim()) errors.province = 'Province is required';
    if (!shippingInfo.postalCode.trim()) {
      errors.postalCode = 'Postal code is required';
    } else if (!/^[0-9]{5}$/.test(shippingInfo.postalCode)) {
      errors.postalCode = 'Postal code must be 5 digits';
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
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateShippingInfo()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (paymentMethod) {
        setCurrentStep(3);
      } else {
        alert('Please select a payment method');
      }
    }
  };

  // Handle order submission
  const handlePlaceOrder = () => {
    // Generate order number
    const orderNum = 'JK' + Date.now().toString().slice(-8);
    setOrderNumber(orderNum);
    
    // Save order to history
    const orderData = {
      orderNumber: orderNum,
      items: cart,
      shippingInfo,
      paymentMethod,
      subtotal,
      tax,
      shipping,
      total,
      orderDate: Date.now(),
      status: 'processing'
    };
    addOrder(orderData);
    
    setOrderConfirmed(true);
    
    // Clear cart after successful order
    setTimeout(() => {
      clearCart();
    }, 500);
  };

  // Helper function for payment method names
  const getPaymentMethodName = (method) => {
    const methods = {
      'bank-transfer': 'Bank Transfer',
      'credit-card': 'Credit/Debit Card',
      'gopay': 'GoPay',
      'ovo': 'OVO',
      'dana': 'DANA',
      'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
  };

  // Render payment instructions based on selected method
  const renderPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'bank-transfer':
        return (
          <div className="instructions-content">
            <p>Please transfer the total amount to:</p>
            <div className="bank-details">
              <strong>Bank BCA</strong><br />
              Account: 1234567890<br />
              Name: PT Janoer Koening Batik<br />
              <strong>Bank Mandiri</strong><br />
              Account: 9876543210<br />
              Name: PT Janoer Koening Batik
            </div>
            <p className="note">Include your order number in the transfer notes.</p>
          </div>
        );
      case 'credit-card':
        return (
          <p>You will receive a payment link via email to complete your payment securely.</p>
        );
      case 'gopay':
      case 'ovo':
      case 'dana':
        return (
          <p>You will receive a payment notification in your {getPaymentMethodName(paymentMethod)} app.</p>
        );
      case 'cod':
        return (
          <p>Please prepare the exact amount. Payment will be collected upon delivery.</p>
        );
      default:
        return null;
    }
  };

  // Order Confirmation View
  if (orderConfirmed) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-confirmation">
            <div className="confirmation-icon">✓</div>
            <h1>Order Confirmed!</h1>
            <p className="confirmation-message">
              Thank you for your purchase. Your order has been received.
            </p>
            
            <div className="order-details-box">
              <div className="order-detail-row">
                <span>Order Number:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div className="order-detail-row">
                <span>Order Total:</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="order-detail-row">
                <span>Payment Method:</span>
                <strong>{getPaymentMethodName(paymentMethod)}</strong>
              </div>
              <div className="order-detail-row">
                <span>Estimated Delivery:</span>
                <strong>3-5 Business Days</strong>
              </div>
            </div>

            <div className="payment-instructions">
              <h3>Payment Instructions</h3>
              {renderPaymentInstructions()}
            </div>

            <div className="confirmation-actions">
              <Button variant="primary" size="large" onClick={() => navigate('/')}>
                Continue Shopping
              </Button>
              <Button variant="outline" size="large" onClick={() => window.print()}>
                Print Order Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Checkout View
  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="checkout-title">Checkout</h1>

        {/* Progress Steps */}
        <div className="checkout-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Shipping</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Payment</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Review</div>
          </div>
        </div>

        <div className="checkout-content">
          {/* Left Column - Forms */}
          <div className="checkout-main">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <div className="checkout-section">
                <h2>Shipping Information</h2>
                <form className="checkout-form">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleInputChange}
                      className={formErrors.fullName ? 'error' : ''}
                    />
                    {formErrors.fullName && <span className="error-message">{formErrors.fullName}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className={formErrors.email ? 'error' : ''}
                      />
                      {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        placeholder="08123456789"
                        className={formErrors.phone ? 'error' : ''}
                      />
                      {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Street Address *</label>
                    <textarea
                      id="address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      rows="3"
                      className={formErrors.address ? 'error' : ''}
                    />
                    {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className={formErrors.city ? 'error' : ''}
                      />
                      {formErrors.city && <span className="error-message">{formErrors.city}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="province">Province *</label>
                      <input
                        type="text"
                        id="province"
                        name="province"
                        value={shippingInfo.province}
                        onChange={handleInputChange}
                        className={formErrors.province ? 'error' : ''}
                      />
                      {formErrors.province && <span className="error-message">{formErrors.province}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="postalCode">Postal Code *</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={shippingInfo.postalCode}
                        onChange={handleInputChange}
                        placeholder="12345"
                        maxLength="5"
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
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'bank-transfer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="bank-transfer"
                      checked={paymentMethod === 'bank-transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>Bank Transfer</strong>
                      <span>BCA, Mandiri, BNI</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'credit-card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>Credit/Debit Card</strong>
                      <span>Visa, Mastercard, JCB</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'gopay' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="gopay"
                      checked={paymentMethod === 'gopay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>GoPay</strong>
                      <span>E-wallet payment</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'ovo' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="ovo"
                      checked={paymentMethod === 'ovo'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>OVO</strong>
                      <span>E-wallet payment</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'dana' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="dana"
                      checked={paymentMethod === 'dana'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>DANA</strong>
                      <span>E-wallet payment</span>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when you receive</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <div className="checkout-section">
                <h2>Review Your Order</h2>
                
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
                        <img src={item.product.images[0]} alt={item.product.name} />
                        <div className="review-item-details">
                          <h4>{item.product.name}</h4>
                          <p>Size: {item.size} | Color: {item.color}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                        <div className="review-item-price">
                          {formatPrice(item.product.price * item.quantity)}
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
                  Back
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleNextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="large"
                  onClick={handlePlaceOrder}
                >
                  Place Order
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-items">
                {cart && cart.map((item) => (
                  <div key={item.cartItemId} className="summary-item">
                    <span className="item-name">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="item-price">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="summary-row">
                <span>Tax (PPN 11%)</span>
                <span>{formatPrice(tax)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
              </div>

              {subtotal >= 1000000 && (
                <div className="free-shipping-note">
                  🎉 You got free shipping!
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
