import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { Badge, PageHeader } from './ui';
import { formatPrice } from '../../../utils/formatPrice';
import './admin.css';

const CustomerDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [custRes, ordersRes] = await Promise.all([
          adminService.getCustomerById(id),
          adminService.getCustomerOrders(id),
        ]);
        setCustomer(custRes.data ?? custRes);
        setOrders(ordersRes.data ?? ordersRes.orders ?? ordersRes);
      } catch (e) {
        setError(e.message || 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;

  if (error || !customer) {
    return (
      <div className="admin-card admin-card-pad">
        <p className="text-danger text-sm">{error || 'Customer not found.'}</p>
        <button className="tc-btn-ghost mt-3" onClick={() => navigate('/admin/customers')}>← Back to customers</button>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
    .reduce((sum, o) => sum + (o.totalPrice ?? o.totalAmount ?? 0), 0);

  return (
    <section>
      <PageHeader title={customer.name || 'Customer'} subtitle={customer.email} backTo="/admin/customers" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Profile</h3>
            <dl className="text-sm space-y-2.5">
              <div className="flex justify-between"><dt className="text-ink-500">Name</dt><dd className="font-medium">{customer.name || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Email</dt><dd>{customer.email}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Role</dt><dd><Badge tone={customer.role === 'admin' ? 'info' : 'neutral'}>{customer.role || 'customer'}</Badge></dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Joined</dt><dd>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '—'}</dd></div>
              {customer.phone && <div className="flex justify-between"><dt className="text-ink-500">Phone</dt><dd>{customer.phone}</dd></div>}
            </dl>
          </div>
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Lifetime value</h3>
            <p className="text-2xl font-semibold tracking-tight">{formatPrice(totalSpent)}</p>
            <p className="text-xs text-ink-500 mt-1">across {orders.length} order{orders.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Recent orders</h3>
            {orders.length === 0 ? (
              <p className="text-sm text-ink-500">No orders yet.</p>
            ) : (
              <div className="divide-y divide-line -my-1">
                {orders.slice(0, 8).map((o) => (
                  <button
                    key={o._id}
                    type="button"
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-canvas/60 -mx-2 px-2"
                    onClick={() => navigate(`/admin/orders/${o._id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">#{String(o.orderNumber ?? o._id?.slice(-6) ?? '').toUpperCase()}</p>
                      <p className="text-xs text-ink-500">{new Date(o.createdAt).toLocaleDateString()} · {o.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{formatPrice(o.totalPrice ?? o.totalAmount)}</span>
                      <Badge tone={o.paymentStatus === 'paid' ? 'success' : 'neutral'}>{o.paymentMethod === 'cod' ? 'COD' : (o.paymentStatus || 'unpaid')}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomerDetailAdmin;
