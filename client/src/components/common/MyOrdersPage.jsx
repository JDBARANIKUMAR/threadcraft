import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatINR } from '../../utils/formatPrice';

const paymentStatusStyles = {
  completed: 'text-emerald-700',
  pending: 'text-amber-600',
  failed: 'text-clay-600',
  refunded: 'text-ink-500',
};

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
        if (alive && res?.success) setOrders(res.data || []);
      } catch (err) {
        if (alive) setError(err.message || 'Could not load your orders.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchOrders();
    return () => {
      alive = false;
    };
  }, []);

  const fmtDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="rule-heading mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">My Orders</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 animate-pulse bg-canvasd" />
          ))}
        </div>
      ) : error ? (
        <div className="border border-line bg-white px-6 py-12 text-center">
          <p className="text-sm text-ink-900">{error}</p>
          <Link to="/login" className="btn-primary mt-5">Sign in to view orders</Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-line bg-white px-6 py-16 text-center">
          <Package className="mx-auto h-8 w-8 text-ink-300" strokeWidth={1.5} />
          <p className="mt-4 font-display text-lg font-semibold text-ink-900">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Once you place an order it will appear here with live status and payment details.
          </p>
          <Link to="/shop" className="btn-primary mt-7">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="border border-line bg-white">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-sm font-semibold text-ink-900">{order.orderNumber}</span>
                  <span className="text-xs text-ink-400">{fmtDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className={`font-semibold uppercase tracking-wideplus ${paymentStatusStyles[order.paymentStatus] || 'text-ink-500'}`}>
                    {order.paymentStatus}
                  </span>
                  <span className="border border-line px-2 py-0.5 font-medium text-ink-700">{order.orderStatus}</span>
                </div>
              </div>

              {/* Items */}
              <ul className="divide-y divide-line px-5">
                {(order.items || []).map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 py-4">
                    <div className="h-16 w-12 shrink-0 overflow-hidden bg-canvasd">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg">👕</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-500">
                        {item.size}
                        {item.colour?.name && (
                          <>
                            {' · '}
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-ink-900/25"
                              style={{ backgroundColor: item.colour.hex }}
                            />
                            {item.colour.name}
                          </>
                        )}
                        {' · '}Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900">{formatINR(item.totalPrice || item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3.5 text-xs text-ink-500">
                <span>
                  {order.paymentMethod === 'cod'
                    ? 'Cash on delivery'
                    : order.paymentId
                      ? `Paid via Razorpay · ${order.paymentId}`
                      : 'Awaiting payment'}
                </span>
                <span className="text-sm font-semibold text-ink-900">{formatINR(order.totalAmount)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MyOrdersPage;
