import { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured, SUPABASE_ORDERS_TABLE } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

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

const normalizeOrder = (orderRecord) => {
  const payload = orderRecord?.payload && typeof orderRecord.payload === 'object'
    ? orderRecord.payload
    : orderRecord;

  const orderNumber = payload.orderNumber || orderRecord?.order_number || payload.id || orderRecord?.id;

  return {
    ...payload,
    id: payload.id || orderRecord?.id || orderNumber,
    orderNumber,
    orderDate: payload.orderDate || orderRecord?.created_at || Date.now(),
    status: payload.status || orderRecord?.status || 'processing'
  };
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
      ...order
    });
  });

  return Array.from(orderMap.values()).sort((left, right) => {
    const leftDate = new Date(left.orderDate || 0).getTime();
    const rightDate = new Date(right.orderDate || 0).getTime();
    return rightDate - leftDate;
  });
};

const toSupabaseRow = (orderData, userId = null) => ({
  order_number: orderData.orderNumber,
  email: orderData.shippingInfo?.email || '',
  status: orderData.status || 'processing',
  user_id: userId,
  payload: {
    ...orderData,
    id: orderData.id || orderData.orderNumber,
    orderNumber: orderData.orderNumber,
    orderDate: orderData.orderDate || Date.now()
  }
});

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState(() => {
    const savedOrders = safeParseOrders(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (Array.isArray(savedOrders)) {
      return savedOrders;
    }
    return [];
  });

  // Save orders to localStorage whenever they change.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  // Add new order
  const addOrder = async (orderData) => {
    const newOrder = {
      ...orderData,
      id: orderData.orderNumber || `JK${Date.now().toString().slice(-8)}`,
      orderDate: Date.now(),
      status: 'processing'
    };

    setOrders((prevOrders) => mergeOrders([newOrder], prevOrders));

    if (!isSupabaseConfigured || !supabase) {
      return newOrder;
    }

    try {
      // For guest orders (user_id is null), skip read-back to avoid RLS policy failure.
      // The SELECT policy requires auth.uid() = user_id, but NULL = NULL is not true in SQL.
      // Local state already has the correct order data. Guest orders can be retrieved via
      // the secure Edge Function lookup-order when needed.
      if (!user) {
        await supabase
          .from(SUPABASE_ORDERS_TABLE)
          .upsert(toSupabaseRow(newOrder, null), { onConflict: 'order_number' });
      } else {
        // For authenticated users, read-back is safe and useful for consistency
        const { data, error } = await supabase
          .from(SUPABASE_ORDERS_TABLE)
          .upsert(toSupabaseRow(newOrder, user.id), { onConflict: 'order_number' })
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const remoteOrder = normalizeOrder(data);
          setOrders((prevOrders) => mergeOrders([remoteOrder], prevOrders));
        }
      }
    } catch (error) {
      console.error('Error saving order to Supabase:', error);
    }

    return newOrder;
  };

  // Get order by ID
  const getOrderById = (orderId) => {
    return orders.find(order => order.id === orderId || order.orderNumber === orderId);
  };

  const value = {
    orders,
    addOrder,
    getOrderById,
    orderCount: orders.length
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
