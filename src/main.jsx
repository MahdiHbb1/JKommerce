import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { OrderProvider } from './context/OrderContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { HelmetProvider } from 'react-helmet-async';
import ToastContainer from './components/Toast/ToastContainer';
import App from './App';
import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';
import './styles/tokens.css';
import './index.css';

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
};

const registerAnalytics = () => {
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (!plausibleDomain) {
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = import.meta.env.VITE_PLAUSIBLE_SCRIPT_SRC || 'https://plausible.io/js/script.js';
  script.setAttribute('data-domain', plausibleDomain);
  document.head.appendChild(script);
};

registerServiceWorker();
registerAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <LanguageProvider>
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
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
