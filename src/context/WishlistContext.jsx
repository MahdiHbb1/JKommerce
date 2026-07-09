import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(() => {
    // Load wishlist from localStorage on initialization
    const savedWishlist = localStorage.getItem('jk-wishlist');
    if (savedWishlist) {
      try {
        return JSON.parse(savedWishlist);
      } catch (error) {
        console.error('Error loading wishlist:', error);
        return [];
      }
    }
    return [];
  });

  const isFirstRender = useRef(true);

  // Save wishlist to localStorage whenever it changes (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem('jk-wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Sync wishlist with Supabase when user is authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return;
    }

    const syncWishlistWithSupabase = async () => {
      try {
        // Fetch user's wishlist from Supabase
        const { data: supabaseWishlist, error } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching wishlist from Supabase:', error);
          return;
        }

        // Convert Supabase wishlist to local format
        const supabaseWishlistItems = supabaseWishlist.map(item => ({
          ...item.product_data,
          addedAt: item.added_at
        }));

        // Merge with local wishlist (local takes precedence for duplicates)
        const mergedWishlist = [...wishlistItems];
        supabaseWishlistItems.forEach(supabaseItem => {
          const exists = mergedWishlist.find(local => local.id === supabaseItem.id);
          if (!exists) {
            mergedWishlist.push(supabaseItem);
          }
        });

        setWishlistItems(mergedWishlist);

        // Upload merged wishlist to Supabase
        for (const item of mergedWishlist) {
          await supabase
            .from('wishlist_items')
            .upsert({
              user_id: user.id,
              product_id: item.id,
              product_data: item,
              added_at: item.addedAt || Date.now()
            }, { onConflict: 'user_id,product_id' });
        }
      } catch (error) {
        console.error('Error syncing wishlist with Supabase:', error);
      }
    };

    syncWishlistWithSupabase();
  }, [user]);

  // Sync wishlist changes to Supabase when user is authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return;
    }

    const syncWishlistChangesToSupabase = async () => {
      try {
        // Clear existing wishlist items for this user
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id);

        // Insert all current wishlist items
        for (const item of wishlistItems) {
          await supabase
            .from('wishlist_items')
            .insert({
              user_id: user.id,
              product_id: item.id,
              product_data: item,
              added_at: item.addedAt || Date.now()
            });
        }
      } catch (error) {
        console.error('Error syncing wishlist changes to Supabase:', error);
      }
    };

    syncWishlistChangesToSupabase();
  }, [wishlistItems, user]);

  // Add item to wishlist
  const addToWishlist = (product) => {
    setWishlistItems(prev => {
      // Check if item already exists
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev;
      }
      return [...prev, { ...product, addedAt: Date.now() }];
    });
  };

  // Remove item from wishlist
  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  // Clear entire wishlist
  const clearWishlist = () => {
    setWishlistItems([]);
  };

  // Toggle item in wishlist (add if not present, remove if present)
  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    toggleWishlist,
    wishlistCount: wishlistItems.length
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
