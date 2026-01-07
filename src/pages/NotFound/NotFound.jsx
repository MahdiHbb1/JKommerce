import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-graphic">
            <div className="batik-pattern">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <defs>
                  <pattern id="batik-404" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="8" fill="#8B4513" opacity="0.2"/>
                    <circle cx="20" cy="20" r="4" fill="#D4AF37" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#batik-404)"/>
                <text x="100" y="120" fontSize="72" fontWeight="700" fill="#1a3a52" textAnchor="middle" fontFamily="Playfair Display, serif">404</text>
              </svg>
            </div>
          </div>

          <div className="not-found-text">
            <h1>Page Not Found</h1>
            <p className="subtitle">The batik pattern you're looking for doesn't exist in our collection</p>
            <p className="description">
              We couldn't find the page you were looking for. Perhaps you mistyped the URL, 
              or the page has been moved to a new location.
            </p>

            <div className="not-found-actions">
              <Link to="/" className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                Back to Home
              </Link>
              <Link to="/shop" className="btn btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Browse Collection
              </Link>
            </div>

            <div className="suggestions">
              <h3>You might be interested in:</h3>
              <ul>
                <li><Link to="/shop">Shop All Batik</Link></li>
                <li><Link to="/about">Learn About Our Heritage</Link></li>
                <li><Link to="/cart">View Your Cart</Link></li>
                <li><Link to="/wishlist">Check Your Wishlist</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
