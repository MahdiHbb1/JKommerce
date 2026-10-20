import { createContext, useState, useContext, useEffect } from 'react';

const OrderContext = createContext();

const LOCAL_STORAGE_KEY = 'jk-orders';

const safeParseOrders = (rawValue) => {
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    console.error('Error loading orders:', error);
    return [];
  }
};

const mergeOrders = (primaryOrders, secondaryOrders) => {
  const orderMap = new Map();

  [...secondaryOrders, ...primaryOrders].forEach((order) => {
    const key = order.orderNumber || order.id;
    if (!key) {
      return;
    }

    orderMap.set(key, {
      ...(orderMap.get(key) || {}),
      ...order,
    });
  });

  return Array.from(orderMap.values()).sort((left, right) => {
    const leftDate = new Date(left.orderDate || 0).getTime();
    const rightDate = new Date(right.orderDate || 0).getTime();
    return rightDate - leftDate;
  });
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    const savedOrders = safeParseOrders(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (Array.isArray(savedOrders)) {
      return savedOrders;
    }
    return [];
  });

  // Cache lokal hanya untuk tampilan; sumber kebenaran pesanan adalah DB.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  /**
   * Membuat pesanan lewat Edge Function create-order (server yang memvalidasi
   * harga, stok, dan total). Tidak pernah menulis langsung ke tabel orders.
   */
  const createOrder = async (orderInput) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      const configError = new Error('supabase_not_configured');
      configError.code = 'supabase_not_configured';
      throw configError;
    }

    let response;
    try {
      response = await fetch(`${supabaseUrl}/functions/v1/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(orderInput),
      });
    } catch {
      const error = new Error('network_error');
      error.code = 'network_error';
      throw error;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Respons non-JSON ditangani sebagai kegagalan generik di bawah.
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.error || 'create_order_failed');
      error.code = data?.error || 'create_order_failed';
      error.status = response.status;
      error.details = data?.errors;
      throw error;
    }

    if (!data?.order_number) {
      const error = new Error('invalid_response');
      error.code = 'invalid_response';
      throw error;
    }

    const cachedOrder = {
      id: data.order_number,
      orderNumber: data.order_number,
      status: data.status || 'pending_payment',
      totals: data.totals || null,
      expiresAt: data.expires_at || null,
      email: orderInput?.customer?.email || '',
      customerName: orderInput?.customer?.name || '',
      orderDate: Date.now(),
    };

    setOrders((prevOrders) => mergeOrders([cachedOrder], prevOrders));

    return data;
  };

  const getOrderById = (orderId) => {
    return orders.find(
      (order) => order.id === orderId || order.orderNumber === orderId,
    );
  };

  const value = {
    orders,
    createOrder,
    getOrderById,
    orderCount: orders.length,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
