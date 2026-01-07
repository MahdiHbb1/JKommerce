import React from 'react';
import { batikCategories, batikPatterns } from '../../data/products';
import './FilterBar.css';

const FilterBar = ({
  filters,
  onFilterChange,
  onClearFilters,
  sortBy,
  onSortChange,
  productCount
}) => {
  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePatternChange = (pattern) => {
    const newPatterns = filters.patterns.includes(pattern)
      ? filters.patterns.filter(p => p !== pattern)
      : [...filters.patterns, pattern];
    onFilterChange({ ...filters, patterns: newPatterns });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [name]: value === '' ? null : parseInt(value)
      }
    });
  };

  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.patterns.length > 0 || 
    filters.priceRange.min !== null || 
    filters.priceRange.max !== null;

  return (
    <div className="filter-bar">
      {/* Filter Header */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>Filter & Sort</h3>
          <span className="product-count-badge">{productCount} Products</span>
        </div>
        {hasActiveFilters && (
          <button type="button" onClick={onClearFilters} className="clear-filters-btn">
            Clear All
          </button>
        )}
      </div>

      <div className="filter-content">
        {/* Sort By */}
        <div className="filter-section">
          <label className="filter-label">Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)}
            className="filter-select"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <label className="filter-label">Category</label>
          <div className="filter-options">
            {Object.values(batikCategories).map((category) => (
              <label key={category} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pattern Filter */}
        <div className="filter-section">
          <label className="filter-label">Pattern</label>
          <div className="filter-options">
            {Object.values(batikPatterns).map((pattern) => (
              <label key={pattern} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.patterns.includes(pattern)}
                  onChange={() => handlePatternChange(pattern)}
                />
                <span>{pattern}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="filter-section">
          <label className="filter-label">Price Range (IDR)</label>
          <div className="price-inputs">
            <input
              type="number"
              name="min"
              placeholder="Min"
              value={filters.priceRange.min || ''}
              onChange={handlePriceChange}
              className="price-input"
              min="0"
              step="100000"
            />
            <span className="price-separator">—</span>
            <input
              type="number"
              name="max"
              placeholder="Max"
              value={filters.priceRange.max || ''}
              onChange={handlePriceChange}
              className="price-input"
              min="0"
              step="100000"
            />
          </div>
          <div className="price-suggestions">
            <button type="button" onClick={() => onFilterChange({ ...filters, priceRange: { min: 0, max: 1000000 } })}>
              Under 1M
            </button>
            <button type="button" onClick={() => onFilterChange({ ...filters, priceRange: { min: 1000000, max: 1500000 } })}>
              1M - 1.5M
            </button>
            <button type="button" onClick={() => onFilterChange({ ...filters, priceRange: { min: 1500000, max: null } })}>
              Over 1.5M
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
