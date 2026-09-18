// client/src/components/common/admin/AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FaChartBar, FaBox, FaTags, FaWarehouse, FaPalette, FaCog,
  FaImage, FaShoppingCart, FaTicketAlt, FaUsers, FaSlidersH,
  FaBars, FaTimes, FaSignOutAlt, FaStore
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import './admin.css';

// Sidebar structure per brief #3 — grouped, always labelled
const NAV_GROUPS = [
  {
    label: '',
    items: [{ to: '', label: 'Dashboard', icon: <FaChartBar />, end: true }]
  },
  {
    label: 'Store',
    items: [
      { to: 'products', label: 'Products', icon: <FaBox /> },
      { to: 'categories', label: 'Categories', icon: <FaTags /> },
      { to: 'inventory', label: 'Inventory', icon: <FaWarehouse /> }
    ]
  },
  {
    label: 'Customization',
    items: [
      { to: 'designs', label: 'Designs', icon: <FaPalette /> },
      { to: 'settings', label: 'Customization Settings', icon: <FaSlidersH /> }
    ]
  },
  {
    label: 'Content',
    items: [{ to: 'banners', label: 'Homepage Banners', icon: <FaImage /> }]
  },
  {
    label: 'Sales',
    items: [
      { to: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
      { to: 'coupons', label: 'Coupons', icon: <FaTicketAlt /> }
    ]
  },
  {
    label: 'Users',
    items: [{ to: 'customers', label: 'Customers', icon: <FaUsers /> }]
  },
  {
    label: 'System',
    items: [{ to: 'store-settings', label: 'Settings', icon: <FaCog /> }]
  }
];

// Extra route → title mappings for detail/sub pages
const EXTRA_TITLES = {
  'orders/': { crumb: 'Admin / Sales', title: 'Orders' },
  'customers/': { crumb: 'Admin / Users', title: 'Customers' },
  'products/': { crumb: 'Admin / Store', title: 'Products' },
  'categories/': { crumb: 'Admin / Store', title: 'Categories' }
};

// Route → { crumb, title } for the header
const PAGE_META = {};
NAV_GROUPS.forEach((group) => {
  group.items.forEach((item) => {
    PAGE_META[item.to || ''] = {
      crumb: group.label ? `Admin / ${group.label}` : 'Admin',
      title: item.label
    };
  });
});

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setDrawerOpen(false); // close mobile drawer on navigation
  }, [location.pathname]);

  // Resolve the current page title: detail routes (orders/:id etc.) first,
  // then longest nav prefix match.
  const relative = location.pathname.replace(/^\/admin\/?/, '');
  const extra = Object.keys(EXTRA_TITLES).find((k) => relative.startsWith(k));
  const meta = extra
    ? EXTRA_TITLES[extra]
    : PAGE_META[relative] || { crumb: 'Admin', title: 'Dashboard' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <>
      <div className="admin-sidebar-brand">
        <span className="brand-name">THREADCRAFT</span>
        <span className="brand-sub">Studio · Admin</span>
      </div>

      <nav className="flex-1" aria-label="Admin sections">
        {NAV_GROUPS.map((group, gi) => (
          <div className="admin-nav-group" key={gi}>
            {group.label && <p className="admin-nav-label">{group.label}</p>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <NavLink to="/" className="admin-nav-link" style={{ color: '#eae7e2' }}>
          <span className="nav-icon"><FaStore /></span>
          <span>View Storefront</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      {/* Desktop sidebar */}
      <aside className="admin-sidebar hidden lg:flex">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="admin-backdrop lg:hidden" onClick={() => setDrawerOpen(false)} />
          <aside className="admin-sidebar open lg:hidden">{sidebar}</aside>
        </>
      )}

      <div className="admin-main">
        <header className="admin-header">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="admin-menu-btn lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open admin menu"
            >
              {drawerOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="min-w-0">
              <span className="admin-header-crumb">{meta.crumb}</span>
              <h1 className="admin-header-title truncate">{meta.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-canvasd border border-line flex items-center justify-center text-xs font-bold text-ink-900">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-ink-900 max-w-[140px] truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-ink-500 max-w-[140px] truncate">{user?.email || ''}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="admin-btn admin-btn-ghost"
              title="Sign out of admin"
            >
              <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          {/* Supports both <AdminLayout><page/></AdminLayout> composition and
              nested <Outlet/> routers depending on how AdminDashboard mounts it */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
