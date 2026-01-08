import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Recently Viewed Context
 * Tracks products that the user has viewed
 */

const RecentlyViewedContext = createContext();

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};

const STORAGE_KEY = 'janoerkoening_recently_viewed';
const MAX_ITEMS = 8;

export const RecentlyViewedProvider = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    // Load from localStorage on initialization
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
    return [];
  });
  
  const isFirstRender = useRef(true);

  // Save to localStorage whenever it changes (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  }, [recentlyViewed]);

  // Add product to recently viewed
  const addToRecentlyViewed = (product) => {
    if (!product || !product.id) return;

    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item.id !== product.id);
      
      // Add to beginning
      const updated = [
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          images: product.images,
          category: product.category,
          pattern: product.pattern,
          viewedAt: new Date().toISOString(),
        },
        ...filtered,
      ];

      // Limit to MAX_ITEMS
      return updated.slice(0, MAX_ITEMS);
    });
  };

  // Clear all recently viewed
  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Get recently viewed products
  const getRecentlyViewed = (limit) => {
    if (limit) {
      return recentlyViewed.slice(0, limit);
    }
    return recentlyViewed;
  };

  const value = {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    getRecentlyViewed,
  };

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};

RecentlyViewedProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
