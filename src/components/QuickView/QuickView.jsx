import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/products';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../ui/Button';

/**
 * QuickView Modal Component with Tailwind CSS
 * Displays a quick preview of a product with add to cart functionality
 */

const QuickView = ({ product, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success } = useToast();
  const { t, formatCurrency } = useTranslation();

  useEffect(() => {
    if (product) {
      setSelectedImage(0);
      setSelectedSize(product.sizes?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setQuantity(1);
    }
  }, [product]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      selectedSize,
      selectedColor,
      quantity
    };
    addToCart(cartItem);
    success(t('cart.addedToCart', { quantity, name: product.name }));
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    if (isInWishlist(product.id)) {
      success(t('wishlist.removedFromWishlist'));
    } else {
      success(t('wishlist.addedToWishlist'));
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Close quick view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.featured && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-batik-orange text-white text-xs font-semibold rounded-full">
                  {t('product.featured')}
                </span>
              )}
              {product.bestseller && (
                <span className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                  {t('product.bestSeller')}
                </span>
              )}
            </div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index 
                        ? 'border-batik-orange ring-2 ring-batik-orange ring-opacity-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-bold text-batik-orange">
                  {formatCurrency(product.price)}
                </span>
                {product.stock > 0 ? (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('product.inStock')} ({t('product.stockAvailable', { stock: product.stock })})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {t('product.outOfStock')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-batik-brown bg-opacity-10 text-batik-brown rounded-full">
                  {product.category}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-batik-blue bg-opacity-10 text-batik-blue rounded-full">
                  {product.pattern}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Size Options */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label id="quickview-size" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.size')}:
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="quickview-size">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                        selectedSize === size
                          ? 'border-batik-orange bg-batik-orange text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      aria-label={`Select size ${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Options */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label id="quickview-color" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('product.color')}:
                </label>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="quickview-color">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-batik-orange ring-2 ring-batik-orange ring-opacity-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                      aria-label={`Select color ${color}`}
                      aria-pressed={selectedColor === color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.quantity')}:
              </label>
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-gray-400 text-gray-700 transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-16 text-center text-lg font-semibold">
                  {quantity}
                </span>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-gray-400 text-gray-700 transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.stock > 0 && quantity >= product.stock}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="large"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('product.addToCart')}
              </Button>
              <button
                className={`p-3 rounded-lg border-2 transition-all ${
                  isInWishlist(product.id)
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-700'
                }`}
                onClick={handleWishlistToggle}
                aria-label={isInWishlist(product.id) ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}
              >
                <svg 
                  className="w-6 h-6" 
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            <Link
              to={`/product/${product.id}`}
              className="block w-full text-center py-3 text-batik-orange hover:text-batik-orange-dark font-medium transition-colors"
              onClick={onClose}
            >
              {t('product.viewDetails')} →
            </Link>

            {/* Features */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-batik-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span>{t('features.freeShipping')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-batik-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('features.returnPolicy')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="w-5 h-5 text-batik-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('features.authenticBatik')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickView;
