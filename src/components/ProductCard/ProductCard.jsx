import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/products';
import { useWishlist } from '../../context/WishlistContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../ui/Button';

/**
 * ProductCard Component with Tailwind CSS
 * 
 * Features:
 * - Responsive card design with hover effects
 * - Image with scale animation on hover
 * - Quick actions overlay (Quick View, Wishlist)
 * - Category badge
 * - Product info with truncated name
 * - Price display
 * - Add to Cart button
 * - Stock status
 * - Wishlist integration
 */

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [imageError, setImageError] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t } = useTranslation();
  
  const {
    id,
    name,
    slug,
    price,
    pattern,
    category,
    images,
    stock,
    bestseller,
    featured
  } = product;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product);
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isOutOfStock = stock === 0;
  const inWishlist = isInWishlist(id);

  // Eye icon for Quick View
  const EyeIcon = () => (
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
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );

  // Heart icon for Wishlist
  const HeartIcon = ({ filled }) => (
    <svg
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );

  // Shopping cart icon
  const CartIcon = () => (
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
    <div className="group relative bg-white rounded-lg shadow-soft hover:shadow-hover transition-all duration-300">
      <Link to={`/product/${id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg bg-neutral-100">
          {/* Category Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block px-3 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full shadow-sm">
              {pattern}
            </span>
          </div>

          {/* Status Badges - Top Right */}
          {(featured || bestseller || isOutOfStock) && (
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
              {featured && (
                <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  {t('product.featured')}
                </span>
              )}
              {bestseller && (
                <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  {t('product.bestseller')}
                </span>
              )}
              {isOutOfStock && (
                <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full shadow-sm">
                  {t('product.outOfStock')}
                </span>
              )}
            </div>
          )}

          {/* Product Image */}
          {!imageError ? (
            <img 
              src={images[0]} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-700">
              <div className="text-center text-white px-4">
                <svg
                  className="w-16 h-16 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm font-medium">{name}</p>
              </div>
            </div>
          )}

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            {/* Quick View Button */}
            {onQuickView && (
              <button
                onClick={handleQuickView}
                className="p-3 bg-white text-primary-600 rounded-full hover:bg-primary-600 hover:text-white transition-colors shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                aria-label={t('product.quickView')}
              >
                <EyeIcon />
              </button>
            )}

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className={`p-3 rounded-full transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75 ${
                inWishlist
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-neutral-600 hover:bg-red-500 hover:text-white'
              }`}
              aria-label={inWishlist ? t('product.removeFromWishlist') : t('product.addToWishlist')}
            >
              <HeartIcon filled={inWishlist} />
            </button>
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white text-lg font-bold">{t('product.outOfStock')}</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-1">
            {category}
          </p>

          {/* Product Name */}
          <h3 className="text-lg font-semibold text-neutral-900 mb-2 truncate group-hover:text-primary-600 transition-colors">
            {name}
          </h3>

          {/* Price */}
          <p className="text-xl font-bold text-primary-600 mb-4">
            {formatPrice(price)}
          </p>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            icon={<CartIcon />}
          >
            {isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
          </Button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
