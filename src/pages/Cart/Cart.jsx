import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/Button/Button';
import './Cart.css';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { success, error, info } = useToast();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleRemoveItem = (cartItemId, productName) => {
    if (window.confirm(`Remove "${productName}" from cart?`)) {
      removeFromCart(cartItemId);
      info(`Removed "${productName}" from cart`);
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      clearCart();
      success('Cart cleared');
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
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <Link to="/shop">
              <Button variant="primary" size="large">Start Shopping</Button>
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
          <h1>Shopping Cart</h1>
          <button onClick={handleClearCart} className="clear-cart-btn">
            Clear Cart
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
                      <span className="variant-tag">Size: {item.selectedSize}</span>
                    )}
                    {item.selectedColor && (
                      <span className="variant-tag">Color: {item.selectedColor}</span>
                    )}
                  </div>

                  <div className="cart-item-actions-mobile">
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
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
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-price">
                  <p className="item-price">{formatPrice(item.price)}</p>
                  {item.quantity > 1 && (
                    <p className="item-subtotal">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  )}
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.cartItemId, item.quantity, -1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
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
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>
            
            <div className="summary-row">
              <span>Tax (PPN 11%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link to="/checkout">
              <Button variant="primary" size="large" fullWidth>
                Proceed to Checkout
              </Button>
            </Link>
            
            <Link to="/shop">
              <Button variant="outline" size="medium" fullWidth>
                Continue Shopping
              </Button>
            </Link>

            <div className="shipping-notice">
              <p>🚚 Free shipping on all orders</p>
              <p>📦 Ships within 2-3 business days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
