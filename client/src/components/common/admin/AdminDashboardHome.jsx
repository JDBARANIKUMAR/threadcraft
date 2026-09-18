import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPackage, FiShoppingBag, FiUsers, FiAlertTriangle, FiClock, FiTrendingUp,
} from 'react-icons/fi';
import { adminService } from '../../../services/adminService';
import { productService } from '../../../services/productService';
import { Badge, PageHeader } from './ui';
import { formatPrice } from '../../../utils/formatPrice';
import './admin.css';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, productsRes] = await Promise.all([
          adminService.getStats(),
          productService.getProducts({ includeInactive: true, limit: 200 }),
        ]);
        setStats(statsRes.data ?? statsRes);
        const products = productsRes.products ?? productsRes.data ?? [];
        const low = products
          .map((p) => {
            const variants = (p.colourVariants ?? p.colours ?? []).filter((v) => v.active !== false);
            const variantStock = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
            const total = variants.length ? variantStock : (p.stock ?? 0);
            return { _id: p._id, name: p.name, total };
          })
          .filter((p) => p.total <= 5)
          .sort((a, b) => a.total - b.total)
          .slice(0, 6);
        setLowStock(low);
      } catch {
        /* interceptor handles */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;

  const s = stats || {};
  const cards = [
    { label: 'Total revenue', value: formatPrice(s.totalSales ?? s.totalRevenue ?? 0), icon: FiTrendingUp, tone: 'clay', to: '/admin/orders' },
    { label: 'Total orders', value: s.totalOrders ?? 0, icon: FiShoppingBag, tone: 'ink', to: '/admin/orders' },
    { label: 'Pending orders', value: s.pendingOrders ?? 0, icon: FiClock, tone: 'warning', to: '/admin/orders' },
    { label: 'Products', value: s.totalProducts ?? 0, icon: FiPackage, tone: 'ink', to: '/admin/products' },
    { label: 'Customers', value: s.totalCustomers ?? s.totalUsers ?? 0, icon: FiUsers, tone: 'ink', to: '/admin/customers' },
    { label: 'Low stock', value: lowStock.length, icon: FiAlertTriangle, tone: lowStock.length ? 'warning' : 'ink', to: '/admin/inventory' },
  ];

  const recentOrders = s.recentOrders ?? s.recent ?? [];
  const monthly = s.monthlySales ?? [];

  return (
    <section>
      <PageHeader title="Dashboard" subtitle="Live numbers from your store — nothing simulated" />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => navigate(c.to)}
            className="admin-stat-card text-left group"
          >
            <div className={`admin-stat-icon tone-${c.tone}`}><c.icon size={16} /></div>
            <p className="admin-stat-value">{c.value}</p>
            <p className="admin-stat-label group-hover:text-clay transition-colors">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="admin-card admin-card-pad lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="admin-card-title">Sales — last 6 months</h3>
            <Link to="/admin/orders" className="tc-link text-sm">All orders →</Link>
          </div>
          {monthly.length === 0 ? (
            <p className="text-sm text-ink-500 py-8 text-center">No sales data yet.</p>
          ) : (
            <div className="tc-chart" role="img" aria-label="Bar chart of sales for the last six months">
              {monthly.map((m) => {
                const max = Math.max(...monthly.map((x) => x.sales ?? x.total ?? 0), 1);
                const val = m.sales ?? m.total ?? 0;
                return (
                  <div key={`${m._id?.year ?? m.year}-${m._id?.month ?? m.month}`} className="tc-chart-col" title={`${formatPrice(val)}`}>
                    <span className="tc-chart-value">{val > 0 ? formatPrice(val) : ''}</span>
                    <div className="tc-chart-bar" style={{ height: `${Math.max((val / max) * 100, 2)}%` }} />
                    <span className="tc-chart-label">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(m._id?.month ?? m.month ?? 1) - 1] ?? ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="admin-card admin-card-pad lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="admin-card-title">Recent orders</h3>
            <Link to="/admin/orders" className="tc-link text-sm">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-500 py-4">No orders yet.</p>
          ) : (
            <div className="divide-y divide-line -my-1">
              {recentOrders.slice(0, 5).map((o) => (
                <button
                  key={o._id}
                  type="button"
                  className="w-full py-2.5 flex items-center justify-between text-left hover:bg-canvas/60 -mx-2 px-2"
                  onClick={() => navigate(`/admin/orders/${o._id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">#{String(o.orderNumber ?? o._id?.slice(-6) ?? '').toUpperCase()}</p>
                    <p className="text-xs text-ink-500">{o.user?.name || o.shippingAddress?.fullName || 'Guest'} · {new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(o.totalPrice ?? o.totalAmount)}</p>
                    <Badge tone={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'info'}>{o.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="admin-card admin-card-pad mt-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="admin-card-title flex items-center gap-2"><FiAlertTriangle className="text-warning" size={15} /> Low stock alerts</h3>
            <Link to="/admin/inventory" className="tc-link text-sm">Inventory →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((p) => (
              <div key={p._id} className="border border-line bg-canvas/50 px-3 py-2.5 flex items-center justify-between">
                <span className="text-sm truncate pr-2">{p.name}</span>
                <Badge tone={p.total === 0 ? 'danger' : 'warning'}>{p.total} left</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default DashboardHome;
