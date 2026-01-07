import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import Button from '../ui/Button';

/**
 * CartDrawer Component
 * Slide-in shopping cart drawer with backdrop overlay
 */

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cartItems: cart, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle checkout
  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    onClose();
    navigate('/shop');
  };

  // Format price as Indonesian Rupiah
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Close icon SVG
  const CloseIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  // Empty cart icon SVG
  const EmptyCartIcon = () => (
    <svg
      className="w-24 h-24 text-neutral-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );

  // Shopping bag icon SVG
  const ShoppingBagIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  );

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <h2
            id="cart-drawer-title"
            className="text-xl font-bold text-neutral-900 flex items-center gap-2"
          >
            <ShoppingBagIcon />
            Shopping Cart
            {getTotalItems() > 0 && (
              <span className="ml-1 text-sm font-normal text-neutral-600">
                ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body - Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <EmptyCartIcon />
              <h3 className="mt-6 text-lg font-semibold text-neutral-900">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm text-neutral-600 max-w-xs">
                Looks like you haven't added any batik products yet. Start shopping to fill your cart!
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueShopping}
                className="mt-6"
              >
                Shop Now
              </Button>
            </div>
          ) : (
            // Cart Items
            <div className="space-y-0">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer - Sticky Bottom with Subtotal and Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-200 bg-white px-6 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-neutral-700">Subtotal:</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatPrice(getTotalPrice())}
              </span>
            </div>

            {/* Shipping Notice */}
            <p className="text-xs text-neutral-600 text-center">
              Shipping and taxes calculated at checkout
            </p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

CartDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CartDrawer;
