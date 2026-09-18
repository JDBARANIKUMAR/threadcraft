// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
