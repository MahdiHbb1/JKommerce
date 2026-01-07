import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import products from '../../data/products';
import './SearchBar.css';

const SearchBar = ({ isMobile, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.technique.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limit to 5 results

      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
      setSearchTerm('');
      if (onClose) onClose();
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
    setShowResults(false);
    setSearchTerm('');
    if (onClose) onClose();
  };

  const handleViewAllResults = () => {
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
      setSearchTerm('');
      if (onClose) onClose();
    }
  };

  return (
    <div className={`search-bar ${isMobile ? 'mobile' : ''}`} ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search batik products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          autoComplete="off"
        />
        <button type="submit" className="search-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          <div className="search-results-list">
            {searchResults.map(product => (
              <div 
                key={product.id}
                className="search-result-item"
                onClick={() => handleProductClick(product.id)}
              >
                <img src={product.image} alt={product.name} className="result-image" />
                <div className="result-info">
                  <h4 className="result-name">{product.name}</h4>
                  <p className="result-category">{product.category} · {product.technique}</p>
                  <p className="result-price">Rp {product.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
          {searchResults.length >= 5 && (
            <button 
              className="view-all-button"
              onClick={handleViewAllResults}
            >
              View all results for "{searchTerm}"
            </button>
          )}
        </div>
      )}

      {showResults && searchTerm.trim() && searchResults.length === 0 && (
        <div className="search-results">
          <div className="no-results">
            <p>No products found for "{searchTerm}"</p>
            <button onClick={() => navigate('/shop')}>Browse all products</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
