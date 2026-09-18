// client/src/App.jsx
import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/common/LoginPage';
import Profile from './components/common/Profile';
import RegisterPage from './components/common/RegisterPage';
import ShopPage from './components/common/ShopPage';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './components/common/Home';
import ProductList from './components/common/ProductList';
import ProductDetail from './components/common/ProductDetail';
import CartPage from './components/common/CartPage';
import Checkout from './components/common/Checkout';
import MyOrdersPage from './components/common/MyOrdersPage';
import AdminDashboard from './components/common/AdminDashboard';
import SupportPage from './components/common/SupportPage';
import CustomTShirtPage from './components/customizer/CustomTShirtPage';

const readStoredSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem('tc_auth_session') || 'null');
  } catch {
    return null;
  }
};

const PUBLIC_PATHS = [
  '/',
  '/shop',
  '/products',
  '/customize',
  '/wishlist',
  '/cart',
  '/login',
  '/register',
  '/support',
];

const isPublicPath = (pathname) => {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/products/') || pathname.startsWith('/product/')) return true;
  return false;
};

const AppAccess = () => {
  const location = useLocation();
  const { loading } = useAuth();
  const session = readStoredSession();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isAdminPage = location.pathname === '/admin';
  const isAdminView = isAdminPage && session?.role === 'admin';

  if (loading) return <div className="min-h-screen bg-canvas" />;

  if (session?.isLoggedIn && (isLoginPage || isRegisterPage)) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/'} replace />;
  }

  if (!session?.isLoggedIn && !isPublicPath(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  if (session?.role !== 'admin' && isAdminPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink-900 font-sans">
      {!isLoginPage && !isAdminView && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/customize" element={<CustomTShirtPage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/customize" element={<ProductDetail />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/wishlist" element={<ProductList showFavorites />} />
          <Route path="/addresses" element={<Profile />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<SupportPage />} />
        </Routes>
      </main>
      {!isLoginPage && !isAdminView && <Footer />}
    </div>
  );
};

function App() {
  return <AppAccess />;
}

export default App;
