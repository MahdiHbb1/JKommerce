import { useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import { useCart } from '../../context/CartContext';
import { Link } from 'react-router-dom';
import './OrderHistory.css';

const OrderHistory = () => {
  const { orders } = useOrders();
  const { addToCart } = useCart();
  const [expandedOrder, setExpandedOrder] = useState(null);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleReorder = (order) => {
    order.items.forEach(item => {
      addToCart(item, item.quantity, item.selectedSize, item.selectedColor);
    });
    alert('Items have been added to your cart!');
  };

  const getStatusColor = (status) => {
    const colors = {
      'processing': '#f39c12',
      'shipped': '#3498db',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      'bank-transfer': 'Bank Transfer',
      'credit-card': 'Credit/Debit Card',
      'gopay': 'GoPay',
      'ovo': 'OVO',
      'dana': 'DANA',
      'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
  };

  if (orders.length === 0) {
    return (
      <div className="order-history-page">
        <div className="container">
          <div className="order-header">
            <h1>Order History</h1>
            <p className="order-subtitle">Track and manage your orders</p>
          </div>

          <div className="empty-orders">
            <div className="empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M9 2L7.17 4H3c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1h-4.17L15 2H9z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h2>No orders yet</h2>
            <p>Start shopping and your orders will appear here</p>
            <Link to="/shop" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="container">
        <div className="order-header">
          <h1>Order History</h1>
          <p className="order-subtitle">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>
        </div>

        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-summary" onClick={() => toggleOrderDetails(order.id)}>
                <div className="order-info">
                  <div className="order-number">
                    <strong>Order #{order.orderNumber || order.id}</strong>
                    <span 
                      className="order-status" 
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="order-meta">
                    <span className="order-date">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="order-items-count">
                      {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="order-total-info">
                  <div className="order-total">
                    Rp {order.total?.toLocaleString('id-ID') || '0'}
                  </div>
                  <button className="expand-btn">
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 20 20" 
                      className={expandedOrder === order.id ? 'rotated' : ''}
                    >
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <div className="order-items">
                    <h3>Order Items</h3>
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <img src={item.image} alt={item.name} />
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <p className="item-variants">
                            {item.selectedSize && `Size: ${item.selectedSize}`}
                            {item.selectedColor && ` · Color: ${item.selectedColor}`}
                          </p>
                          <p className="item-quantity">Qty: {item.quantity}</p>
                        </div>
                        <div className="item-price">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-info-grid">
                    <div className="info-section">
                      <h3>Shipping Address</h3>
                      <p>{order.shippingInfo?.fullName}</p>
                      <p>{order.shippingInfo?.phone}</p>
                      <p>{order.shippingInfo?.address}</p>
                      <p>{order.shippingInfo?.city}, {order.shippingInfo?.province} {order.shippingInfo?.postalCode}</p>
                    </div>

                    <div className="info-section">
                      <h3>Payment Method</h3>
                      <p>{getPaymentMethodName(order.paymentMethod)}</p>
                    </div>

                    <div className="info-section order-totals">
                      <h3>Order Summary</h3>
                      <div className="total-row">
                        <span>Subtotal</span>
                        <span>Rp {order.subtotal?.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="total-row">
                        <span>Tax (11%)</span>
                        <span>Rp {order.tax?.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="total-row">
                        <span>Shipping</span>
                        <span>{order.shipping === 0 ? 'FREE' : `Rp ${order.shipping?.toLocaleString('id-ID')}`}</span>
                      </div>
                      <div className="total-row final-total">
                        <strong>Total</strong>
                        <strong>Rp {order.total?.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button className="btn btn-secondary" onClick={() => handleReorder(order)}>
                      Reorder
                    </button>
                    <Link to="/shop" className="btn btn-outline">
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
