import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { adminService } from '../../../services/adminService';
import { Badge, EmptyState, PageHeader } from './ui';
import { formatPrice } from '../../../utils/formatPrice';
import OrderDetailAdmin from './OrderDetailAdmin';
import './admin.css';

const PAGE_SIZE = 10;

// Matches the Order schema's capitalised orderStatus lifecycle
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed'];

const statusTone = (s) => {
  switch (s) {
    case 'Pending': return 'warning';
    case 'Confirmed':
    case 'Processing':
    case 'Shipped':
    case 'Out for Delivery': return 'info';
    case 'Delivered': return 'success';
    case 'Cancelled':
    case 'Failed': return 'danger';
    default: return 'neutral';
  }
};

const OrdersTable = ({ orders, onStatusChange, updatingId, onOpen }) => (
  <div className="tc-table-wrap">
    <table className="tc-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Date</th>
          <th className="cell-right">Total</th>
          <th className="cell-center">Payment</th>
          <th>Fulfilment</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o._id}>
            <td>
              <button type="button" className="font-medium tc-link" onClick={() => onOpen(o._id)}>
                #{o.orderNumber}
              </button>
            </td>
            <td>
              <div className="leading-tight">
                <div>{o.user?.name || o.shippingAddress?.fullName || '—'}</div>
                <div className="text-xs text-ink-500">{o.user?.email || ''}</div>
              </div>
            </td>
            <td className="text-ink-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
            <td className="cell-right font-medium whitespace-nowrap">{formatPrice(o.totalAmount)}</td>
            <td className="cell-center">
              <Badge tone={o.paymentStatus === 'completed' ? 'success' : o.paymentStatus === 'failed' ? 'danger' : 'neutral'}>
                {o.paymentMethod === 'cod' ? 'COD' : o.paymentStatus}
              </Badge>
            </td>
            <td>
              <select
                className="tc-select !py-1 !text-xs"
                value={o.orderStatus}
                disabled={updatingId === o._id}
                onChange={(e) => onStatusChange(o._id, e.target.value)}
              >
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await adminService.getAllOrders({ limit: 500 });
        setOrders(res.data ?? res.orders ?? res);
      } catch {
        /* interceptor handles */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = async (id, orderStatus) => {
    setUpdatingId(id);
    const prev = orders;
    setOrders((os) => os.map((o) => (o._id === id ? { ...o, orderStatus } : o)));
    try {
      await adminService.updateOrderStatus(id, { orderStatus });
    } catch {
      setOrders(prev);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'All' && o.orderStatus !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(o.orderNumber ?? '').toLowerCase().includes(q) ||
      (o.user?.name || '').toLowerCase().includes(q) ||
      (o.user?.email || '').toLowerCase().includes(q) ||
      (o.shippingAddress?.fullName || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageOrders = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section>
      <PageHeader
        title="Orders"
        subtitle="Update fulfilment inline — payment state is managed by Razorpay verification"
      />

      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="search-icon">⌕</span>
          <input
            className="admin-input"
            placeholder="Search order number or customer…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </label>
        <select
          className="admin-select !w-auto"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="All">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
      ) : pageOrders.length === 0 ? (
        <div className="admin-card">
          <EmptyState title={orders.length === 0 ? 'No orders yet' : 'No orders match your filters'} />
        </div>
      ) : (
        <div className="admin-card !border-0 !shadow-none">
          <OrdersTable
            orders={pageOrders}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
            onOpen={(id) => navigate(`/admin/orders/${id}`)}
          />
        </div>
      )}

      <Pagination
        page={safePage}
        pages={totalPages}
        total={filtered.length}
        onPage={setPage}
      />
    </section>
  );
};

// Route wrapper: list at /admin/orders, detail at /admin/orders/:id
const AdminOrders = () => (
  <Routes>
    <Route index element={<OrdersList />} />
    <Route path=":id" element={<OrderDetailAdmin />} />
    <Route path="*" element={<Navigate to="." replace />} />
  </Routes>
);

export default AdminOrders;
