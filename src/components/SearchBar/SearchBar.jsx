import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import fallbackProducts from '../../data/products';
import { fetchProducts } from '../../lib/db/catalog';
import { toCardProduct } from '../../lib/db/presenters';
import { useTranslation } from '../../hooks/useTranslation';
import './SearchBar.css';

const SearchBar = ({ isMobile, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [catalog, setCatalog] = useState(fallbackProducts);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;

    fetchProducts()
      .then((products) => {
        if (active) {
          setCatalog(products.map(toCardProduct));
        }
      })
      .catch(() => {
        // Keep the local seed as an offline fallback for suggestions.
      });

    return () => {
      active = false;
    };
  }, []);

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
      const query = searchTerm.toLowerCase();
      const filtered = catalog.filter((product) => (
        [product.name, product.category, product.technique, product.description, product.pattern]
          .some((value) => typeof value === 'string' && value.toLowerCase().includes(query))
      )).slice(0, 5); // Limit to 5 results

      setSearchResults(filtered);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm, catalog]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
      setShowResults(false);
      setSearchTerm('');
      if (onClose) onClose();
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.slug || product.id}`);
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
          id="search-batik"
          name="search"
          placeholder={t('search.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          autoComplete="off"
          aria-label={t('search.placeholder')}
        />
        <button type="submit" className="search-button" aria-label={t('common.search')}>
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
                role="button"
                tabIndex={0}
                aria-label={product.name}
                onClick={() => handleProductClick(product)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleProductClick(product);
                  }
                }}
              >
                {product.images?.[0] || product.image ? (
                  <img src={product.images?.[0] || product.image} alt={product.name} className="result-image" />
                ) : (
                  <span className="result-image result-image-placeholder">{t('product.noImage')}</span>
                )}
                <div className="result-info">
                  <h4 className="result-name">{product.name}</h4>
                  <p className="result-category">
                    {[product.category, product.technique].filter(Boolean).join(' · ')}
                  </p>
                  <p className="result-price">Rp {Number(product.price || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
          {searchResults.length >= 5 && (
            <button 
              className="view-all-button"
              onClick={handleViewAllResults}
            >
              {t('search.viewAll', { term: searchTerm })}
            </button>
          )}
        </div>
      )}

      {showResults && searchTerm.trim() && searchResults.length === 0 && (
        <div className="search-results">
          <div className="no-results">
            <p>{t('search.noResultsFor', { term: searchTerm })}</p>
            <button onClick={() => navigate('/shop')}>{t('search.browseAll')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
