import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { OrderProvider } from './context/OrderContext';
import { ToastProvider } from './context/ToastContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import ToastContainer from './components/Toast/ToastContainer';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ToastProvider>
        <RecentlyViewedProvider>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <ToastContainer />
                <App />
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
        </RecentlyViewedProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
