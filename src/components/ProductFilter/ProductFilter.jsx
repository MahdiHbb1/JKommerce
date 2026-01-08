import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '../ui/Input';
import Button from '../ui/Button';

/**
 * ProductFilter Component
 * Advanced filtering sidebar for products with:
 * - Category filters
 * - Pattern filters
 * - Price range slider
 * - Collapsible sections
 * - Clear/Apply buttons
 */

const ProductFilter = ({ filters, onFilterChange, onClearFilters, productStats }) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    patterns: true,
    priceRange: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handlePatternChange = (pattern) => {
    const newPatterns = filters.patterns.includes(pattern)
      ? filters.patterns.filter((p) => p !== pattern)
      : [...filters.patterns, pattern];
    
    onFilterChange({ ...filters, patterns: newPatterns });
  };

  const handlePriceChange = (type, value) => {
    onFilterChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [type]: parseInt(value, 10),
      },
    });
  };

  // Chevron icon
  const ChevronIcon = ({ isOpen }) => (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const categories = [
    { value: 'Batik Tulis', label: 'Batik Tulis', count: productStats?.categoryCount?.['Batik Tulis'] || 0 },
    { value: 'Batik Cap', label: 'Batik Cap', count: productStats?.categoryCount?.['Batik Cap'] || 0 },
    { value: 'Batik Printing', label: 'Batik Printing', count: productStats?.categoryCount?.['Batik Printing'] || 0 },
  ];

  const patterns = [
    { value: 'Parang', label: 'Parang', count: productStats?.patternCount?.['Parang'] || 0 },
    { value: 'Kawung', label: 'Kawung', count: productStats?.patternCount?.['Kawung'] || 0 },
    { value: 'Mega Mendung', label: 'Mega Mendung', count: productStats?.patternCount?.['Mega Mendung'] || 0 },
    { value: 'Sekar Jagad', label: 'Sekar Jagad', count: productStats?.patternCount?.['Sekar Jagad'] || 0 },
    { value: 'Truntum', label: 'Truntum', count: productStats?.patternCount?.['Truntum'] || 0 },
    { value: 'Sidomukti', label: 'Sidomukti', count: productStats?.patternCount?.['Sidomukti'] || 0 },
    { value: 'Sogan', label: 'Sogan', count: productStats?.patternCount?.['Sogan'] || 0 },
  ];

  const hasActiveFilters = filters.categories.length > 0 || filters.patterns.length > 0;

  return (
    <div className="card p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-neutral-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories Section */}
        <div className="border-b border-neutral-200 pb-6">
          <button
            onClick={() => toggleSection('categories')}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              Categories
            </span>
            <ChevronIcon isOpen={expandedSections.categories} />
          </button>

          {expandedSections.categories && (
            <div className="mt-4 space-y-3">
              {categories.map((category) => (
                <Checkbox
                  key={category.value}
                  name={`category-${category.value}`}
                  label={
                    <span className="flex items-center justify-between w-full">
                      <span>{category.label}</span>
                      <span className="text-xs text-neutral-500">({category.count})</span>
                    </span>
                  }
                  checked={filters.categories.includes(category.value)}
                  onChange={() => handleCategoryChange(category.value)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Patterns Section */}
        <div className="border-b border-neutral-200 pb-6">
          <button
            onClick={() => toggleSection('patterns')}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              Patterns
            </span>
            <ChevronIcon isOpen={expandedSections.patterns} />
          </button>

          {expandedSections.patterns && (
            <div className="mt-4 space-y-3">
              {patterns.map((pattern) => (
                <Checkbox
                  key={pattern.value}
                  name={`pattern-${pattern.value}`}
                  label={
                    <span className="flex items-center justify-between w-full">
                      <span>{pattern.label}</span>
                      <span className="text-xs text-neutral-500">({pattern.count})</span>
                    </span>
                  }
                  checked={filters.patterns.includes(pattern.value)}
                  onChange={() => handlePatternChange(pattern.value)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Price Range Section */}
        <div className="pb-6">
          <button
            onClick={() => toggleSection('priceRange')}
            className="flex items-center justify-between w-full text-left group mb-4"
          >
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              Price Range
            </span>
            <ChevronIcon isOpen={expandedSections.priceRange} />
          </button>

          {expandedSections.priceRange && (
            <div className="space-y-4">
              {/* Min Price */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  id="filter-price-min"
                  name="price-min"
                  min="0"
                  step="100000"
                  value={filters.priceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Rp 0"
                  aria-label="Minimum price filter"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  id="filter-price-max"
                  name="price-max"
                  min="0"
                  step="100000"
                  value={filters.priceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Rp 10,000,000"
                  aria-label="Maximum price filter"
                />
              </div>

              {/* Price Range Display */}
              <div className="pt-2 text-center">
                <span className="text-sm text-neutral-600">
                  {formatPrice(filters.priceRange.min)} - {formatPrice(filters.priceRange.max)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Apply Button */}
        <Button variant="primary" size="md" fullWidth>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

ProductFilter.propTypes = {
  filters: PropTypes.shape({
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    patterns: PropTypes.arrayOf(PropTypes.string).isRequired,
    priceRange: PropTypes.shape({
      min: PropTypes.number.isRequired,
      max: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  productStats: PropTypes.shape({
    categoryCount: PropTypes.object,
    patternCount: PropTypes.object,
  }),
};

export default ProductFilter;
