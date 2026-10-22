import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * CartItem Component
 * Displays a single item in the shopping cart with quantity controls
 */

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const { id, name, price, image, size, color, quantity } = item;
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();
  const maxQuantity = Number.isFinite(item.stock) && item.stock > 0 ? item.stock : 10;

  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onUpdateQuantity(id, quantity + 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onUpdateQuantity(id, Math.min(value, maxQuantity));
    }
  };

  // Format price as Indonesian Rupiah
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Trash icon SVG
  const TrashIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-200 last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            className="w-20 h-20 object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-primary-700 text-white flex items-center justify-center p-2 text-center text-[10px] leading-tight">
            {t('product.noImage')}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        {/* Product Name */}
        <h4 className="text-sm font-semibold text-neutral-900 truncate mb-1">
          {name}
        </h4>

        {/* Variant Info */}
        <div className="flex gap-3 text-xs text-neutral-600 mb-2">
          {size && (
            <span className="flex items-center gap-1">
              <span className="font-medium">{t('product.size')}:</span>
              <span>{size}</span>
            </span>
          )}
          {color && (
            <span className="flex items-center gap-1">
              <span className="font-medium">{t('product.color')}:</span>
              <span>{color}</span>
            </span>
          )}
        </div>

        {/* Price */}
        <p className="text-base font-bold text-primary-600 mb-3">
          {formatPrice(price)}
        </p>

        {/* Quantity Controls & Remove Button */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
            {/* Decrease Button */}
            <button
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="min-w-11 min-h-11 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label={t('cart.decreaseQuantity')}
            >
              <span className="text-lg font-semibold text-neutral-600">−</span>
            </button>

            {/* Quantity Input */}
            <input
              type="number"
              id={`cart-quantity-${id}`}
              name="quantity"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              className="w-12 text-center border-x border-neutral-300 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={t('cart.quantityFor', { name })}
            />

            {/* Increase Button */}
            <button
              onClick={handleIncrease}
              disabled={quantity >= maxQuantity}
              className="min-w-11 min-h-11 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label={t('cart.increaseQuantity')}
            >
              <span className="text-lg font-semibold text-neutral-600">+</span>
            </button>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onRemove(id)}
            className="min-h-11 flex items-center gap-1 px-2 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-xs font-medium"
            aria-label={t('cart.removeItem')}
          >
            <TrashIcon />
            <span>{t('cart.remove')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    size: PropTypes.string,
    color: PropTypes.string,
    quantity: PropTypes.number.isRequired,
  }).isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default CartItem;
