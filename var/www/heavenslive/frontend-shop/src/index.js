import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ShopProvider } from './contexts/ShopContext';
import './i18n/config';
import './index.css';
import App from './App';

// Detect if we're on the subdomain or subpath
const getBasename = () => {
  const hostname = window.location.hostname;
  if (hostname === 'shop.heavenslive.com') {
    return '';
  }
  return '/shop';
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ShopProvider>
        <BrowserRouter basename={getBasename()}>
          <App />
        </BrowserRouter>
      </ShopProvider>
    </HelmetProvider>
  </React.StrictMode>
);
