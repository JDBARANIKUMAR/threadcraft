import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  LogOut,
  Package,
  MapPin,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { readAccountData, writeAccountData } from '../../utils/accountStorage';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(() => localStorage.getItem('tc_profile_avatar') || '');

  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleAvatarUpdate = (event) => setProfileAvatar(event.detail || '');
    window.addEventListener('tc-avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('tc-avatar-updated', handleAvatarUpdate);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const data = readAccountData(user);
      const nextSearchHistory = [searchQuery.trim(), ...data.searchHistory.filter((item) => item !== searchQuery.trim())].slice(0, 20);
      writeAccountData(user, { ...data, searchHistory: nextSearchHistory });
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('tc_auth_session');
    localStorage.removeItem('tc_login_role');
    navigate('/login');
  };

  const navLinkClass = (path) =>
    `text-[13px] font-medium tracking-wide transition-colors hover:text-ink-900 ${
      location.pathname === path ? 'text-ink-900' : 'text-ink-500'
    }`;

  return (
    <nav className="relative z-40 bg-canvas border-b border-line">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 h-16">
        {/* Left: primary navigation */}
        <div className="flex flex-1 items-center justify-start gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/shop" className={navLinkClass('/shop')}>Shop All</Link>
            <Link to="/customize" className={navLinkClass('/customize')}>Customize Studio</Link>
          </nav>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-ink-700 hover:text-ink-900 transition-colors md:ml-2"
            title="Search products"
            aria-label="Search products"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Center: brand */}
        <div className="flex flex-1 items-center justify-center">
          <Link to="/" className="flex items-center justify-center shrink-0 text-ink-900">
            <span className="font-display text-xl font-bold tracking-[0.08em]">THREADCRAFT</span>
          </Link>
        </div>

        {/* Right: actions */}
        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <Link
            to="/wishlist"
            className="relative p-2 text-ink-700 hover:text-ink-900 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-[18px] h-[18px]" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-clay-500 text-ink-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-2 text-ink-700 hover:text-ink-900 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-[18px] h-[18px]" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] h-[18px] bg-ink-900 text-ink-900 text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {totalItems}
              </span>
            )}
          </Link>

          <div className="relative">
            {isAuthenticated ? (
              <div>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 text-ink-900 transition-colors hover:text-ink-600"
                >
                  {profileAvatar.startsWith('emoji:') ? (
                    <div className="w-7 h-7 rounded-full bg-canvasd text-base flex items-center justify-center" role="img" aria-label="Selected cartoon avatar">
                      {profileAvatar.replace('emoji:', '')}
                    </div>
                  ) : profileAvatar ? (
                    <img src={profileAvatar} alt="Profile avatar" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-canvasd text-ink-700 font-semibold flex items-center justify-center text-xs border border-line">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-semibold max-w-[80px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-line shadow-panel p-1.5 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-line mb-1">
                      <p className="text-xs font-semibold text-ink-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-ink-500 truncate">{user?.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-clay-600 hover:bg-canvasd rounded-sm transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-canvasd rounded-sm transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/addresses"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-canvasd rounded-sm transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>My Addresses</span>
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-canvasd rounded-sm transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="border-t border-line my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-clay-600 hover:bg-clay-50 rounded-sm transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-ink-700 hover:text-ink-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-ink-900 hover:bg-ink-800 text-canvas px-4 py-2 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-ink-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Live Search Bar Slide-Down */}
      {searchOpen && (
        <div className="border-t border-line bg-white p-4 animate-slide-down">
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search tees, fits, styles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn-primary">
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 py-5 flex flex-col gap-4 animate-slide-down">
          <Link to="/" className="text-sm font-semibold text-ink-900 py-1.5">Home</Link>
          <Link to="/shop" className="text-sm font-semibold text-ink-900 py-1.5">Shop All Products</Link>
          <Link to="/customize" className="text-sm font-semibold text-ink-900 py-1.5">Customize Studio</Link>

          {!isAuthenticated ? (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line">
              <Link to="/login" className="btn-quiet justify-center">Sign In</Link>
              <Link to="/register" className="btn-primary justify-center">Register</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-3 border-t border-line">
              <div className="text-xs text-ink-500">Signed in as <span className="text-ink-900 font-semibold">{user?.email}</span></div>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 py-2 text-xs font-semibold text-clay-600">
                  <Shield className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <Link to="/orders" className="py-2 text-xs font-semibold text-ink-900">My Orders</Link>
              <Link to="/addresses" className="py-2 text-xs font-semibold text-ink-900">My Addresses</Link>
              <Link to="/profile" className="py-2 text-xs font-semibold text-ink-900">Account Settings</Link>
              <button onClick={handleLogout} className="py-2 text-left text-xs font-semibold text-clay-600">
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
