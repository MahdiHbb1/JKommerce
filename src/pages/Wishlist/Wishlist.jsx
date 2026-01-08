import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import './Wishlist.css';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart({
      ...product,
      selectedSize: product.sizes?.[0] || 'One Size',
      selectedColor: product.colors?.[0] || 'Default',
      quantity: 1
    });
  };

  const handleRemove = (productId) => {
    removeFromWishlist(productId);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="wishlist-header">
            <h1>My Wishlist</h1>
            <p className="wishlist-subtitle">Save your favorite batik pieces</p>
          </div>

          <div className="empty-wishlist">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Start adding your favorite batik products to your wishlist</p>
            <Link to="/shop" className="btn btn-primary">
              Explore Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <div>
            <h1>My Wishlist</h1>
            <p className="wishlist-subtitle">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved</p>
          </div>
          {wishlistItems.length > 0 && (
            <button onClick={clearWishlist} className="btn-clear">
              Clear All
            </button>
          )}
        </div>

        <div className="wishlist-grid">
          {wishlistItems.map(item => (
            <div key={item.id} className="wishlist-card">
              <button 
                className="remove-btn"
                onClick={() => handleRemove(item.id)}
                aria-label="Remove from wishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              <Link to={`/product/${item.id}`} className="wishlist-image-link">
                <img src={item.images?.[0] || item.image} alt={item.name} className="wishlist-image" />
              </Link>

              <div className="wishlist-info">
                <Link to={`/product/${item.id}`} className="wishlist-name">
                  {item.name}
                </Link>
                <p className="wishlist-category">{item.category} · {item.technique}</p>
                <p className="wishlist-price">Rp {item.price.toLocaleString('id-ID')}</p>

                <div className="wishlist-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </button>
                  <Link to={`/product/${item.id}`} className="btn btn-secondary">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="wishlist-footer">
          <Link to="/shop" className="btn btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
