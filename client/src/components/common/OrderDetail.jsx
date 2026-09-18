import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const target = id ? `/orders/${id}` : '/orders/my-orders';
        const res = await api.get(target);
        const data = id ? res.data.data : res.data.data;
        setOrder(id ? data : data?.[0] ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="text-ink-900">Loading order...</div>;
  }

  if (!order) {
    return <div className="text-ink-900">No order found.</div>;
  }

  return (
    <section className="max-w-4xl mx-auto py-8">
      <div className="rounded-sm border border-white/10 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-black text-ink-900">Order Details</h1>
        <div className="mt-4 text-sm text-ink-700">
          <div>Order ID: {order._id}</div>
          <div>Status: {order.orderStatus}</div>
          <div>Total: ${Number(order.totalAmount || 0).toFixed(2)}</div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetail;
