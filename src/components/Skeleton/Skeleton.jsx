import React from 'react';
import PropTypes from 'prop-types';

/**
 * Skeleton Loading Components
 * Displays placeholder content while data is loading
 */

// Generic Skeleton Box
export const Skeleton = ({ className = '', width, height }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`skeleton ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
};

Skeleton.propTypes = {
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-soft p-4 animate-pulse">
      {/* Image */}
      <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-4" />
      
      {/* Category */}
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
      
      {/* Product Name */}
      <div className="h-5 bg-gray-200 rounded w-full mb-2" />
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
      
      {/* Price */}
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
      
      {/* Button */}
      <div className="h-10 bg-gray-200 rounded w-full" />
    </div>
  );
};

// Product Grid Skeleton
export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

ProductGridSkeleton.propTypes = {
  count: PropTypes.number,
};

// Product Detail Skeleton
export const ProductDetailSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-square bg-gray-200 rounded" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-full mb-2" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6" />
          
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-6" />
          
          <div className="space-y-3 mb-6">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
          
          <div className="h-12 bg-gray-200 rounded w-full mb-3" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
};

// Cart Item Skeleton
export const CartItemSkeleton = () => {
  return (
    <div className="flex gap-4 py-4 border-b border-neutral-200 animate-pulse">
      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
};

// List Skeleton
export const ListSkeleton = ({ rows = 5, height = 16 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="bg-gray-200 rounded"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};

ListSkeleton.propTypes = {
  rows: PropTypes.number,
  height: PropTypes.number,
};

// Text Skeleton
export const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded"
          style={{ width: index === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};

TextSkeleton.propTypes = {
  lines: PropTypes.number,
  className: PropTypes.string,
};

// Button Skeleton
export const ButtonSkeleton = ({ className = '', fullWidth = false }) => {
  return (
    <div
      className={`h-10 bg-gray-200 rounded-lg animate-pulse ${
        fullWidth ? 'w-full' : 'w-32'
      } ${className}`}
    />
  );
};

ButtonSkeleton.propTypes = {
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
};

// Image Skeleton
export const ImageSkeleton = ({ aspectRatio = '1/1', className = '' }) => {
  return (
    <div
      className={`bg-gray-200 rounded-lg animate-pulse ${className}`}
      style={{ aspectRatio }}
    />
  );
};

ImageSkeleton.propTypes = {
  aspectRatio: PropTypes.string,
  className: PropTypes.string,
};
