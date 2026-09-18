import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import AdminDashboardHome from './admin/AdminDashboardHome';

// Heavy pages load on demand (brief #41)
const AdminProducts = lazy(() => import('./admin/AdminProducts'));
const AdminCategories = lazy(() => import('./admin/AdminCategories'));
const AdminOrders = lazy(() => import('./admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./admin/AdminCustomers'));
const AdminInventory = lazy(() => import('./admin/AdminInventory'));
const AdminDesigns = lazy(() => import('./admin/AdminDesigns'));
const AdminBanners = lazy(() => import('./admin/AdminBanners'));
const AdminCoupons = lazy(() => import('./admin/AdminCoupons'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));

const PageFallback = () => (
  <div className="flex items-center justify-center py-24">
    <span className="tc-spinner" aria-label="Loading page" />
  </div>
);

const AdminDashboard = () => (
  <AdminLayout>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route index element={<AdminDashboardHome />} />
        {/* Nested route groups render their own sub-routes */}
        <Route path="products/*" element={<AdminProducts />} />
        <Route path="categories/*" element={<AdminCategories />} />
        <Route path="orders/*" element={<AdminOrders />} />
        <Route path="customers/*" element={<AdminCustomers />} />
        <Route path="inventory/*" element={<AdminInventory />} />
        {/* Single-page sections */}
        <Route path="designs" element={<AdminDesigns />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </Suspense>
  </AdminLayout>
);

export default AdminDashboard;
