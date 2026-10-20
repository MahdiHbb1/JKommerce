import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const OrderContext = createContext();

const LOCAL_STORAGE_KEY = 'jk-orders';

const ORDER_SELECT =
  'id, order_number, status, email, customer, address, subtotal_idr, shipping_idr, discount_idr, tax_idr, total_idr, tax_mode, payment_preference, courier, tracking_number, expires_at, paid_at, shipped_at, delivered_at, cancelled_at, created_at, order_items(name_snapshot, qty, unit_price_idr, variant_snapshot)';

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

/**
 * Baris `orders` (select milik sendiri lewat RLS) ke bentuk tampilan.
 * Hanya field yang memang dibutuhkan UI; payload/internal_note tidak dibaca.
 */
const mapOrderRow = (row) => ({
  id: row.id,
  isAccountOrder: true,
  orderNumber: row.order_number,
  status: row.status,
  orderDate: row.created_at,
  total: row.total_idr,
  subtotal: row.subtotal_idr,
  shipping: row.shipping_idr,
  discount: row.discount_idr,
  tax: row.tax_idr,
  taxMode: row.tax_mode,
  paymentMethod: row.payment_preference,
  courier: row.courier,
  trackingNumber: row.tracking_number,
  expiresAt: row.expires_at,
  paidAt: row.paid_at,
  shippedAt: row.shipped_at,
  deliveredAt: row.delivered_at,
  cancelledAt: row.cancelled_at,
  email: row.email,
  customerName: row.customer?.name ?? null,
  shippingInfo: {
    fullName: row.address?.recipient ?? row.customer?.name ?? '',
    phone: row.address?.phone ?? row.customer?.phone ?? '',
    address: row.address?.full_address ?? '',
    city: row.address?.city ?? '',
    province: row.address?.province ?? '',
    postalCode: row.address?.postal_code ?? '',
    email: row.email,
  },
  items: (row.order_items ?? []).map((item) => ({
    name: item.name_snapshot,
    quantity: item.qty,
    price: item.unit_price_idr,
    selectedSize: item.variant_snapshot?.size ?? null,
    selectedColor: item.variant_snapshot?.color ?? null,
  })),
});

const cancelErrorMessage = (message) => {
  const knownCodes = [
    'order_not_found',
    'invalid_status',
    'rate_limited',
  ];
  const code = knownCodes.includes(message) ? message : 'cancel_failed';
  const error = new Error(code);
  error.code = code;
  return error;
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState(() => {
    const savedOrders = safeParseOrders(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (Array.isArray(savedOrders)) {
      return savedOrders;
    }
    return [];
  });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const requestIdRef = useRef(0);

  // Pesanan akun tidak ikut ditulis ke cache perangkat supaya tidak
  // tertinggal setelah pengguna keluar dari akun di perangkat bersama.
  useEffect(() => {
    const deviceOrders = orders.filter((order) => !order.isAccountOrder);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(deviceOrders));
  }, [orders]);

  const refreshOrders = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!user?.id || !isSupabaseConfigured || !supabase) {
      setOrders((previousOrders) =>
        previousOrders.filter((order) => !order.isAccountOrder),
      );
      setOrdersLoading(false);
      setOrdersError(null);
      return;
    }

    setOrdersLoading(true);
    setOrdersError(null);

    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (error) {
      console.error('Gagal memuat riwayat pesanan:', error);
      setOrdersError('load_failed');
      setOrdersLoading(false);
      return;
    }

    setOrders((previousOrders) =>
      mergeOrders((data ?? []).map(mapOrderRow), previousOrders),
    );
    setOrdersLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

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
      isAccountOrder: Boolean(user?.id),
      orderNumber: data.order_number,
      status: data.status || 'pending_payment',
      totals: data.totals || null,
      taxMode: data.totals?.tax_mode ?? null,
      paymentMethod: orderInput?.payment_preference || 'manual',
      expiresAt: data.expires_at || null,
      email: orderInput?.customer?.email || '',
      customerName: orderInput?.customer?.name || '',
      orderDate: Date.now(),
    };

    setOrders((prevOrders) => mergeOrders([cachedOrder], prevOrders));

    return data;
  };

  /**
   * Pembatalan memakai RPC security-definer; stok dilepas di server.
   * Nomor + email dicocokkan server, bukan dipercaya dari tampilan.
   */
  const cancelOrder = async (orderNumber, email) => {
    if (!isSupabaseConfigured || !supabase) {
      const error = new Error('supabase_not_configured');
      error.code = 'supabase_not_configured';
      throw error;
    }

    const { data, error } = await supabase.rpc('cancel_order_by_customer', {
      p_order_number: orderNumber,
      p_email: email,
    });

    if (error) {
      throw cancelErrorMessage(error.message?.trim() ?? '');
    }

    const nextStatus = data?.status || 'cancelled';
    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.orderNumber === orderNumber || order.id === orderNumber
          ? { ...order, status: nextStatus }
          : order,
      ),
    );

    return data;
  };

  const getOrderById = (orderId) => {
    return orders.find(
      (order) => order.id === orderId || order.orderNumber === orderId,
    );
  };

  const value = {
    orders,
    ordersLoading: ordersLoading || authLoading,
    ordersError,
    refreshOrders,
    createOrder,
    cancelOrder,
    getOrderById,
    orderCount: orders.length,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
