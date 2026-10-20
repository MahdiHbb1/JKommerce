import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { ProductDetailSkeleton } from '../../components/Skeleton/Skeleton';
import PageMeta from '../../components/Seo/PageMeta';
import { fetchProductBySlug, fetchProducts } from '../../lib/db/catalog';
import { toCardProduct } from '../../lib/db/presenters';
import './ProductDetail.css';

const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const ProductDetail = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success, error } = useToast();
  const { addToRecentlyViewed, getRecentlyViewed } = useRecentlyViewed();
  const { t, formatCurrency } = useTranslation();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Context ini mengubah identitas fungsinya saat state berubah; simpan di ref
  // supaya efek pemuatan produk tidak ikut berjalan ulang.
  const addToRecentlyViewedRef = useRef(addToRecentlyViewed);
  const getRecentlyViewedRef = useRef(getRecentlyViewed);
  useEffect(() => {
    addToRecentlyViewedRef.current = addToRecentlyViewed;
    getRecentlyViewedRef.current = getRecentlyViewed;
  });

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setRelatedProducts([]);

    try {
      const found = await fetchProductBySlug(slug);
      if (!found) {
        navigate('/shop', { replace: true });
        return;
      }

      const sizes = uniqueValues(found.variants.map((variant) => variant.size));
      const colors = uniqueValues(found.variants.map((variant) => variant.color));

      setProduct(found);
      setSelectedSize(sizes[0] ?? '');
      setSelectedColor(colors[0] ?? '');
      setSelectedImage(0);
      setQuantity(1);

      // Simpan bentuk kartu (id = slug) supaya konsisten dengan Shop/Home.
      addToRecentlyViewedRef.current(toCardProduct(found));

      try {
        const all = await fetchProducts();
        const related = all
          .filter((item) => item.slug !== found.slug)
          .sort(
            (a, b) =>
              Number(b.category === found.category) -
              Number(a.category === found.category),
          )
          .slice(0, 4)
          .map(toCardProduct);
        setRelatedProducts(related);
      } catch (relatedError) {
        console.error('Gagal memuat produk serupa:', relatedError);
      }
    } catch (loadFailure) {
      console.error('Gagal memuat produk:', loadFailure);
      setLoadError(loadFailure);
    } finally {
      setIsLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const sizes = useMemo(
    () => uniqueValues((product?.variants ?? []).map((variant) => variant.size)),
    [product],
  );
  const colors = useMemo(
    () => uniqueValues((product?.variants ?? []).map((variant) => variant.color)),
    [product],
  );

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }
    return (
      product.variants.find(
        (variant) =>
          variant.is_active !== false &&
          variant.size === selectedSize &&
          variant.color === selectedColor,
      ) ?? null
    );
  }, [product, selectedSize, selectedColor]);

  const stockAvailable = selectedVariant?.stock_available ?? 0;
  const isAvailable = stockAvailable > 0;

  // Jaga jumlah tetap dalam batas stok varian terpilih.
  useEffect(() => {
    setQuantity((current) => Math.min(current, Math.max(1, stockAvailable)));
  }, [stockAvailable]);

  const cardProduct = useMemo(
    () => (product ? toCardProduct(product) : null),
    [product],
  );

  const recentItems = getRecentlyViewedRef
    .current(6)
    .filter((item) => item.slug !== product?.slug);

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) {
      error(t('product.outOfStockMessage'));
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor, selectedVariant);
    success(t('cart.addedToCart', { quantity, name: product.name }));
  };

  const handleQuantityChange = (change) => {
    const nextQuantity = quantity + change;
    if (nextQuantity >= 1 && nextQuantity <= stockAvailable) {
      setQuantity(nextQuantity);
    }
  };

  const handleRelatedProductClick = (relatedProduct) => {
    navigate(`/product/${relatedProduct.slug || relatedProduct.id}`);
  };

  const handleAddRelatedToCart = (relatedProduct) => {
    addToCart(
      relatedProduct,
      1,
      relatedProduct.sizes?.[0] ?? null,
      relatedProduct.colors?.[0] ?? null,
    );
    success(t('cart.addedToCart', { quantity: 1, name: relatedProduct.name }));
  };

  const handleWishlistToggle = () => {
    toggleWishlist(cardProduct);
    if (isInWishlist(cardProduct.id)) {
      success(t('wishlist.removedFromWishlist'));
    } else {
      success(t('wishlist.addedToWishlist'));
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = t('product.shareText', { name: product.name });

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        success(t('notifications.copied'));
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <PageMeta title={t('product.details')} />
        <div className="container">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="product-detail-page">
        <PageMeta title={t('product.details')} />
        <div className="container">
          <div className="detail-state" role="alert">
            <h1>{t('product.loadError')}</h1>
            <p>{t('product.loadErrorHint')}</p>
            <Button variant="primary" size="large" onClick={loadProduct}>
              {t('common.retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="product-detail-page">
      <PageMeta
        title={product.name}
        description={product.description}
      />
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/shop">{t('nav.shop')}</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product Detail Section */}
        <div className="product-detail">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              {product.images.length > 0 ? (
                <img src={product.images[selectedImage]} alt={product.name} />
              ) : (
                <div
                  className="main-image-placeholder"
                  role="img"
                  aria-label={product.name}
                >
                  {t('product.noImage')}
                </div>
              )}
              {product.is_featured && <span className="badge badge-featured">{t('product.featured')}</span>}
              {product.is_bestseller && <span className="badge badge-bestseller">{t('product.bestSeller')}</span>}
            </div>
            {product.images.length > 1 && (
              <div className="image-thumbnails">
                {product.images.map((image, index) => (
                  <button
                    key={image}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.name}</h1>
              <p className="product-category">{product.category}</p>
            </div>

            <div className="product-price">
              <span className="price-value">{formatCurrency(product.price_idr)}</span>
              <span className="price-note">{t('product.shippingNote')}</span>
            </div>

            {product.description && (
              <div className="product-description">
                <p>{product.description}</p>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="product-option">
                <label className="option-label">{t('product.size')}: <strong>{selectedSize}</strong></label>
                <div className="option-buttons">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`option-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div className="product-option">
                <label className="option-label">{t('product.color')}: <strong>{selectedColor}</strong></label>
                <div className="option-buttons">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`option-btn ${selectedColor === color ? 'active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="product-option">
              <label className="option-label">{t('product.quantity')}</label>
              <div className="quantity-selector">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={!isAvailable || quantity <= 1}
                  className="quantity-btn"
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={!isAvailable || quantity >= stockAvailable}
                  className="quantity-btn"
                >
                  +
                </button>
                <span className={`stock-info ${isAvailable ? '' : 'stock-info-empty'}`}>
                  {isAvailable
                    ? t('product.stockAvailable', { stock: stockAvailable })
                    : t('product.outOfStockMessage')}
                </span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="product-actions">
              <Button 
                variant="primary" 
                size="large" 
                fullWidth 
                onClick={handleAddToCart}
                disabled={!isAvailable}
              >
                {isAvailable ? t('product.addToCart') : t('product.outOfStock')}
              </Button>
              
              <button 
                className={`wishlist-action-btn ${isInWishlist(cardProduct.id) ? 'in-wishlist' : ''}`}
                onClick={handleWishlistToggle}
                title={isInWishlist(cardProduct.id) ? t('wishlist.removeFromWishlist') : t('wishlist.addToWishlist')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(cardProduct.id) ? 'currentColor' : 'none'}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke={isInWishlist(cardProduct.id) ? 'none' : 'currentColor'} strokeWidth="2"/>
                </svg>
                <span>{isInWishlist(cardProduct.id) ? t('wishlist.saved') : t('wishlist.save')}</span>
              </button>
            </div>

            {/* Product Details */}
            <div className="product-details">
              {product.heritage && (
                <div className="detail-item">
                  <h3>{t('product.heritageAndMeaning')}</h3>
                  <p>{product.heritage}</p>
                </div>
              )}
              {product.details && (
                <div className="detail-item">
                  <h3>{t('product.craftsmanshipDetails')}</h3>
                  <p>{product.details}</p>
                </div>
              )}
              {product.pattern && (
                <div className="detail-item">
                  <h3>{t('product.pattern')}</h3>
                  <p>{product.pattern}</p>
                </div>
              )}
            </div>

            {/* Social Share */}
            <div className="social-share">
              <h3>{t('product.shareProduct')}</h3>
              <div className="share-buttons">
                <button onClick={() => handleShare('facebook')} className="share-btn facebook" title="Share on Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button onClick={() => handleShare('whatsapp')} className="share-btn whatsapp" title="Share on WhatsApp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
                <button onClick={() => handleShare('twitter')} className="share-btn twitter" title="Share on Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button onClick={() => handleShare('copy')} className="share-btn copy" title="Copy Link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews — skema ulasan menyusul; belum ada data, jadi jangan tampilkan apa pun selain pesan netral */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>{t('product.customerReviews')}</h2>
          </div>
          <p className="no-reviews">{t('product.noReviews')}</p>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>{t('product.youMayAlsoLike')}</h2>
            <ProductGrid
              products={relatedProducts}
              onAddToCart={handleAddRelatedToCart}
              onQuickView={handleRelatedProductClick}
            />
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentItems.length > 0 && (
          <div className="related-products">
            <h2>{t('product.recentlyViewed')}</h2>
            <ProductGrid
              products={recentItems}
              onAddToCart={handleAddRelatedToCart}
              onQuickView={handleRelatedProductClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
