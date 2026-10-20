import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(() => {
    // Load cart from localStorage on initialization
    try {
      const savedCart = localStorage.getItem('batikCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const getMaxQuantity = (product) => {
    const stock = Number(product?.stock);
    return Number.isFinite(stock) && stock > 0 ? stock : Infinity;
  };

  // Cari varian yang cocok dengan pilihan ukuran/warna. Dipakai semua jalur
  // add-to-cart (Shop, QuickView, ProductDetail) supaya item keranjang selalu
  // membawa variant_id yang nanti dipakai checkout.
  const resolveVariant = (product, selectedSize, selectedColor) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    return (
      variants.find(
        (variant) =>
          variant.is_active !== false &&
          (selectedSize == null || variant.size === selectedSize) &&
          (selectedColor == null || variant.color === selectedColor),
      ) ?? null
    );
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('batikCart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems]);

  // Sync cart with Supabase when user is authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return;
    }

    const syncCartWithSupabase = async () => {
      try {
        // Fetch user's cart from Supabase
        const { data: supabaseCart, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cart from Supabase:', error);
          return;
        }

        // Convert Supabase cart to local format
        const supabaseCartItems = supabaseCart.map(item => ({
          id: item.product_id,
          quantity: item.quantity,
          selectedSize: item.selected_size,
          selectedColor: item.selected_color,
          variantId: item.variant_id,
          cartItemId: item.cart_item_id
        }));

        // Merge with local cart (local takes precedence for duplicates)
        const mergedCart = [...cartItems];
        supabaseCartItems.forEach(supabaseItem => {
          const exists = mergedCart.find(local => local.cartItemId === supabaseItem.cartItemId);
          if (!exists) {
            mergedCart.push(supabaseItem);
          }
        });

        setCartItems(mergedCart);

        // Upload merged cart to Supabase
        for (const item of mergedCart) {
          await supabase
            .from('cart_items')
            .upsert({
              user_id: user.id,
              product_id: item.id,
              variant_id: item.variantId ?? null,
              quantity: item.quantity,
              selected_size: item.selectedSize,
              selected_color: item.selectedColor,
              cart_item_id: item.cartItemId
            }, { onConflict: 'user_id,cart_item_id' });
        }
      } catch (error) {
        console.error('Error syncing cart with Supabase:', error);
      }
    };

    syncCartWithSupabase();
  }, [user]);

  // Sync cart changes to Supabase when user is authenticated
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) {
      return;
    }

    const syncCartChangesToSupabase = async () => {
      try {
        // Clear existing cart items for this user
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        // Insert all current cart items
        for (const item of cartItems) {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: item.id,
              variant_id: item.variantId ?? null,
              quantity: item.quantity,
              selected_size: item.selectedSize,
              selected_color: item.selectedColor,
              cart_item_id: item.cartItemId
            });
        }
      } catch (error) {
        console.error('Error syncing cart changes to Supabase:', error);
      }
    };

    syncCartChangesToSupabase();
  }, [cartItems, user]);

  // Add item to cart
  const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null, variant = null) => {
    // QuickView mengirim pilihan di dalam objek produk, bukan sebagai argumen.
    const effectiveSize = selectedSize ?? product?.selectedSize ?? null;
    const effectiveColor = selectedColor ?? product?.selectedColor ?? null;
    const requestedQuantity = Math.max(
      1,
      quantity > 1 ? quantity : Number(product?.quantity) || 1,
    );
    const resolvedVariant = variant ?? resolveVariant(product, effectiveSize, effectiveColor);

    setCartItems(prevItems => {
      const variantStock = resolvedVariant ? Number(resolvedVariant.stock_available ?? 0) : null;
      const maxQuantity =
        variantStock !== null ? Math.max(0, variantStock) : getMaxQuantity(product);

      // Varian yang dipilih sedang habis — jangan masukkan apa pun.
      if (maxQuantity <= 0) {
        return prevItems;
      }

      // Check if item already exists with same product, size, and color
      const existingItemIndex = prevItems.findIndex(
        item => 
          item.id === product.id && 
          item.selectedSize === effectiveSize && 
          item.selectedColor === effectiveColor
      );

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        const nextQuantity = Math.min(updatedItems[existingItemIndex].quantity + requestedQuantity, maxQuantity);
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: nextQuantity
        };
        return updatedItems;
      } else {
        const nextQuantity = Math.min(requestedQuantity, maxQuantity);

        // Add new item
        return [...prevItems, {
          ...product,
          price: Number(product.price ?? product.price_idr ?? 0),
          image: product.image ?? product.images?.[0] ?? '',
          quantity: nextQuantity,
          selectedSize: effectiveSize || resolvedVariant?.size || (product.sizes ? product.sizes[0] : null),
          selectedColor: effectiveColor || resolvedVariant?.color || (product.colors ? product.colors[0] : null),
          variantId: resolvedVariant?.id ?? null,
          variantSku: resolvedVariant?.sku ?? null,
          ...(resolvedVariant ? { stock: maxQuantity } : {}),
          cartItemId: `${product.id}-${effectiveSize || resolvedVariant?.size || 'default'}-${effectiveColor || resolvedVariant?.color || 'default'}-${Date.now()}`
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (cartItemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
  };

  // Update item quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.cartItemId !== cartItemId) {
          return item;
        }

        const maxQuantity = getMaxQuantity(item);
        return {
          ...item,
          quantity: Math.min(newQuantity, maxQuantity)
        };
      })
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Get total items count
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  const value = {
    cartItems,
    cart: cartItems, // Alias for backwards compatibility
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
