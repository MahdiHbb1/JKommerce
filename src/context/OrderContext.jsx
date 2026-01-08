import { createContext, useState, useContext, useEffect, useRef } from 'react';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    // Load orders from localStorage on initialization
    const savedOrders = localStorage.getItem('jk-orders');
    if (savedOrders) {
      try {
        return JSON.parse(savedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        return [];
      }
    }
    return [];
  });
  
  const isFirstRender = useRef(true);

  // Save orders to localStorage whenever they change (skip initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem('jk-orders', JSON.stringify(orders));
  }, [orders]);

  // Add new order
  const addOrder = (orderData) => {
    const newOrder = {
      ...orderData,
      id: orderData.orderNumber || 'JK' + Date.now().toString().slice(-8),
      orderDate: Date.now(),
      status: 'processing'
    };
    setOrders(prev => [newOrder, ...prev]);
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
