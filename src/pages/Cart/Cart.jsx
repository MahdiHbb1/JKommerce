import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { success, error, info } = useToast();
  const { t, formatCurrency } = useTranslation();

  const handleQuantityChange = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleRemoveItem = (cartItemId, productName) => {
    if (window.confirm(t('cart.removeConfirm', { name: productName }))) {
      removeFromCart(cartItemId);
      info(t('cart.itemRemoved', { name: productName }));
    }
  };

  const handleClearCart = () => {
    if (window.confirm(t('cart.clearConfirm'))) {
      clearCart();
      success(t('cart.cartCleared'));
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                <path d="M9 2L7.17 4H3c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-4.17L15 2H9zm3 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h2>{t('cart.empty')}</h2>
            <p>{t('cart.emptyMessage')}</p>
            <Link to="/shop">
              <Button variant="primary" size="large">{t('cart.startShopping')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping for now
  const tax = Math.round(subtotal * 0.11); // 11% PPN (Indonesian VAT)
  const total = subtotal + shipping + tax;

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>{t('cart.title')}</h1>
          <button onClick={handleClearCart} className="clear-cart-btn">
            {t('cart.clearCart')}
          </button>
        </div>

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.images[0]} alt={item.name} />
                </div>

                <div className="cart-item-details">
                  <Link to={`/product/${item.id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <p className="cart-item-category">{item.category}</p>
                  
                  <div className="cart-item-variants">
                    {item.selectedSize && (
                      <span className="variant-tag">{t('product.size')}: {item.selectedSize}</span>
                    )}
                    {item.selectedColor && (
                      <span className="variant-tag">{t('product.color')}: {item.selectedColor}</span>
                    )}
                  </div>

                  <div className="cart-item-actions-mobile">
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                        disabled={item.quantity <= 1}
                        aria-label={t('cart.decreaseQuantity')}
                      >
                        -
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1)}
                        aria-label={t('cart.increaseQuantity')}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.cartItemId, item.name)}
                      className="remove-item-btn"
                      aria-label={t('cart.removeItem')}
                    >
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>

                <div className="cart-item-price">
                  <p className="item-price">{formatCurrency(item.price)}</p>
                  {item.quantity > 1 && (
                    <p className="item-subtotal">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  )}
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                      disabled={item.quantity <= 1}
                      aria-label={t('cart.decreaseQuantity')}
                    >
                      -
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.cartItemId, item.quantity, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(item.cartItemId, item.name)}
                    className="remove-item-btn"
                    aria-label="Remove item"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <h2>{t('cart.orderSummary')}</h2>
            
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            <div className="summary-row">
              <span>{t('cart.shipping')}</span>
              <span className="free-shipping">{t('cart.freeShipping')}</span>
            </div>
            
            <div className="summary-row">
              <span>{t('cart.tax')}</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>{t('cart.total')}</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Link to="/checkout">
              <Button variant="primary" size="large" fullWidth>
                {t('cart.proceedCheckout')}
              </Button>
            </Link>
            
            <Link to="/shop">
              <Button variant="outline" size="medium" fullWidth>
                {t('cart.continueShopping')}
              </Button>
            </Link>

            <div className="shipping-notice">
              <p>{t('cart.freeShippingNotice')}</p>
              <p>{t('cart.shippingTime')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
