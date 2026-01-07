import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import { getProductById, getRelatedProducts, formatPrice } from '../../data/products';
import Button from '../../components/Button/Button';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { ProductDetailSkeleton } from '../../components/Skeleton/Skeleton';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { success, error } = useToast();
  const { addToRecentlyViewed, getRecentlyViewed } = useRecentlyViewed();
  
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    rating: 5,
    comment: ''
  });
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Sarah Wijaya',
      rating: 5,
      comment: 'Absolutely beautiful batik! The craftsmanship is exceptional and the colors are vibrant. Worth every rupiah.',
      date: '2025-12-15'
    },
    {
      id: 2,
      name: 'Ahmad Kusuma',
      rating: 5,
      comment: 'Bought this as a gift and my mother loved it. The traditional patterns are authentic and the quality is outstanding.',
      date: '2025-12-10'
    },
    {
      id: 3,
      name: 'Rina Pratiwi',
      rating: 4,
      comment: 'Beautiful piece! Shipping was fast and packaging was excellent. Minor color variation from photo but still gorgeous.',
      date: '2025-12-05'
    }
  ]);

  useEffect(() => {
    setIsLoading(true);
    const foundProduct = getProductById(parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedSize(foundProduct.sizes?.[0] || '');
      setSelectedColor(foundProduct.colors?.[0] || '');
      setRelatedProducts(getRelatedProducts(foundProduct.id));
      
      // Track recently viewed
      addToRecentlyViewed(foundProduct);
      
      // Get recently viewed excluding current product
      const recentItems = getRecentlyViewed(5).filter(item => item.id !== foundProduct.id);
      setRecentlyViewed(recentItems);
      
      window.scrollTo(0, 0);
      setTimeout(() => setIsLoading(false), 500);
    } else {
      navigate('/shop');
    }
  }, [id, navigate, addToRecentlyViewed, getRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    if (product.stock === 0) {
      error('This product is currently out of stock');
      return;
    }
    addToCart(product, quantity, selectedSize, selectedColor);
    success(`Added ${quantity}x "${product.name}" to cart!`);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleRelatedProductClick = (relatedProduct) => {
    navigate(`/product/${relatedProduct.id}`);
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    if (isInWishlist(product.id)) {
      success('Removed from wishlist');
    } else {
      success('Added to wishlist');
    }
  };

  const inWishlist = isInWishlist(product.id);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (reviewForm.name.trim() && reviewForm.comment.trim()) {
      const newReview = {
        id: reviews.length + 1,
        name: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        date: new Date().toISOString().split('T')[0]
      };
      setReviews([newReview, ...reviews]);
      setReviewForm({ name: '', rating: 5, comment: '' });
      success('Thank you for your review!');
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={index < rating ? '#f39c12' : '#ddd'}
        className="star-icon"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ));
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} - Premium Batik from Janoer Koening`;
    
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
        alert('Link copied to clipboard!');
        break;
      default:
        break;
    }
  };

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/shop">Shop</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Product Detail Section */}
        <div className="product-detail">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              <img src={product.images[selectedImage]} alt={product.name} />
              {product.featured && <span className="badge badge-featured">Featured</span>}
              {product.bestseller && <span className="badge badge-bestseller">Bestseller</span>}
            </div>
            <div className="image-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-header">
              <h1>{product.name}</h1>
              <p className="product-category">{product.category}</p>
            </div>

            <div className="product-price">
              <span className="price-value">{formatPrice(product.price)}</span>
              <span className="price-note">Free shipping on all orders</span>
            </div>

            <div className="product-description">
              <p>{product.description}</p>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="product-option">
                <label className="option-label">Size: <strong>{selectedSize}</strong></label>
                <div className="option-buttons">
                  {product.sizes.map((size) => (
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
            {product.colors && product.colors.length > 0 && (
              <div className="product-option">
                <label className="option-label">Color: <strong>{selectedColor}</strong></label>
                <div className="option-buttons">
                  {product.colors.map((color) => (
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
              <label className="option-label">Quantity</label>
              <div className="quantity-selector">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="quantity-btn"
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="quantity-btn"
                >
                  +
                </button>
                <span className="stock-info">{product.stock} available</span>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="product-actions">
              <Button 
                variant="primary" 
                size="large" 
                fullWidth 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              
              <button 
                className={`wishlist-action-btn ${inWishlist ? 'in-wishlist' : ''}`}
                onClick={handleWishlistToggle}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke={inWishlist ? 'none' : 'currentColor'} strokeWidth="2"/>
                </svg>
                <span>{inWishlist ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            {/* Product Details */}
            <div className="product-details">
              <div className="detail-item">
                <h3>Heritage & Meaning</h3>
                <p>{product.heritage}</p>
              </div>
              <div className="detail-item">
                <h3>Craftsmanship Details</h3>
                <p>{product.details}</p>
              </div>
              <div className="detail-item">
                <h3>Pattern</h3>
                <p>{product.pattern}</p>
              </div>
            </div>

            {/* Social Share */}
            <div className="social-share">
              <h3>Share this product</h3>
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

        {/* Reviews Section */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Customer Reviews</h2>
            <div className="rating-summary">
              <div className="average-rating">
                <span className="rating-number">{calculateAverageRating()}</span>
                <div className="stars">{renderStars(Math.round(calculateAverageRating()))}</div>
                <span className="review-count">Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
              </div>
            </div>
          </div>

          <div className="reviews-content">
            <div className="reviews-list">
              <h3>What customers say</h3>
              {reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <strong>{review.name}</strong>
                      <span className="review-date">{new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="review-rating">{renderStars(review.rating)}</div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="review-form-container">
              <h3>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rating</label>
                  <div className="rating-input">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${reviewForm.rating >= star ? 'active' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill={reviewForm.rating >= star ? '#f39c12' : '#ddd'}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Review</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows="4"
                    required
                  />
                </div>

                <button type="submit" className="submit-review-btn">
                  Submit Review
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>You May Also Like</h2>
            <ProductGrid
              products={relatedProducts}
              onAddToCart={(p) => {
                addToCart(p, 1);
                success(`Added "${p.name}" to cart!`);
              }}
              onQuickView={handleRelatedProductClick}
            />
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div className="related-products">
            <h2>Recently Viewed</h2>
            <ProductGrid
              products={recentlyViewed}
              onAddToCart={(p) => {
                addToCart(p, 1);
                success(`Added "${p.name}" to cart!`);
              }}
              onQuickView={(p) => navigate(`/product/${p.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
