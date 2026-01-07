import React from 'react';
import ProductCard from '../ProductCard/ProductCard';

/**
 * ProductGrid Component with Tailwind CSS
 * 
 * Responsive grid layout for displaying products
 * - 4 columns on xl screens (1280px+)
 * - 3 columns on lg screens (1024px+)
 * - 2 columns on sm screens (640px+)
 * - 1 column on mobile
 */

const ProductGrid = ({ products, onAddToCart, onQuickView, emptyMessage }) => {
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] py-12">
        <div className="text-center max-w-md">
          {/* Empty cart icon */}
          <svg
            className="w-24 h-24 mx-auto text-neutral-300 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          
          <h3 className="text-2xl font-bold text-neutral-900 mb-3">
            {emptyMessage || 'No products found'}
          </h3>
          
          <p className="text-neutral-600">
            Try adjusting your filters or check back later for new arrivals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
