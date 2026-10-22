import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../hooks/useTranslation';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import QuickView from '../../components/QuickView/QuickView';
import PageMeta from '../../components/Seo/PageMeta';
import Icon from '../../components/ui/Icon';
import './Wishlist.css';

const normalizeProduct = (item) => {
  const images = item.images?.length > 0 ? [...item.images] : [];
  if (images.length === 0 && item.image) {
    images.push(item.image);
  }

  return { ...item, images };
};

const Wishlist = () => {
  const { wishlistItems, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { success } = useToast();
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [justCleared, setJustCleared] = useState(false);
  const emptyHeadingRef = useRef(null);

  const products = wishlistItems.map(normalizeProduct);

  useEffect(() => {
    if (justCleared && products.length === 0) {
      emptyHeadingRef.current?.focus();
      setJustCleared(false);
    }
  }, [justCleared, products.length]);

  const handleAddToCart = (product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      return;
    }

    addToCart(product, 1);
    success(t('notifications.addedToCart'));
  };

  const handleClear = () => {
    clearWishlist();
    setJustCleared(true);
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <div className="wishlist-page">
      <PageMeta
        title={t('wishlist.title')}
        description={t('wishlist.metaDescription')}
      />

      <div className="wishlist-container">
        <header className="wishlist-header">
          <div>
            <p className="wishlist-kicker">{t('nav.wishlist')}</p>
            <h1>{t('wishlist.title')}</h1>
            {products.length > 0 && (
              <p className="wishlist-count">
                {products.length}{' '}
                {products.length === 1
                  ? t('wishlist.item')
                  : t('wishlist.items')}
              </p>
            )}
          </div>

          {products.length > 0 && (
            <button
              type="button"
              className="wishlist-clear"
              onClick={handleClear}
            >
              {t('wishlist.clearAll')}
            </button>
          )}
        </header>

        {products.length === 0 ? (
          <section className="wishlist-empty" aria-labelledby="wishlist-empty-title">
            <span className="wishlist-empty__icon">
              <Icon name="heart" size={30} />
            </span>
            <h2
              id="wishlist-empty-title"
              ref={emptyHeadingRef}
              tabIndex={-1}
            >
              {t('wishlist.empty')}
            </h2>
            <p>{t('wishlist.emptyMessage')}</p>
            <Link to="/shop" className="wishlist-cta">
              {t('wishlist.continueShopping')}
            </Link>
          </section>
        ) : (
          <>
            <section aria-labelledby="wishlist-items-title">
              <h2 id="wishlist-items-title" className="sr-only">
                {t('wishlist.itemsHeading')}
              </h2>
              <ProductGrid
                products={products}
                onAddToCart={handleAddToCart}
                onQuickView={handleQuickView}
              />
            </section>

            <div className="wishlist-footer">
              <Link to="/shop" className="wishlist-text-link">
                {t('wishlist.continueShopping')}
              </Link>
            </div>
          </>
        )}
      </div>

      {quickViewProduct && (
        <QuickView product={quickViewProduct} onClose={closeQuickView} />
      )}
    </div>
  );
};

export default Wishlist;
