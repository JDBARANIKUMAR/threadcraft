import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { Badge, Field, PageHeader } from './ui';
import { formatPrice } from '../../../utils/formatPrice';
import { imageUrl } from '../../../utils/imageUrl';
import './admin.css';

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

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Failed'];

const CustomizationBlock = ({ cust }) => {
  if (!cust?.isCustomized) return null;
  const designs = cust.selectedDesign && Object.keys(cust.selectedDesign).length > 0 ? [cust.selectedDesign] : [];
  const upload = cust.uploadedImage && Object.keys(cust.uploadedImage).length > 0 ? cust.uploadedImage : null;
  return (
    <div className="mt-3 border border-line bg-canvas/50 p-3 text-xs space-y-1.5">
      {cust.printSide ? <div><b>Print side:</b> {cust.printSide}</div> : null}
      {cust.frontElements?.length ? <div><b>Front layers:</b> {cust.frontElements.length}</div> : null}
      {cust.backElements?.length ? <div><b>Back layers:</b> {cust.backElements.length}</div> : null}
      {cust.text ? <div><b>Text:</b> “{cust.text}”</div> : null}
      {designs.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <b>Design:</b> {d.name || 'Custom graphic'}
          {d.url && <img src={imageUrl(d.url, 48)} alt="design" className="h-8 w-8 object-contain border border-line bg-white" />}
        </div>
      ))}
      {upload && (
        <div className="flex items-center gap-2">
          <b>Upload:</b>
          {upload.url && <img src={imageUrl(upload.url, 48)} alt="customer upload" className="h-10 w-10 object-contain border border-line bg-white" />}
        </div>
      )}
      {cust.previewSnapshot ? (
        <div className="flex items-center gap-2">
          <b>Preview:</b>
          <img src={imageUrl(cust.previewSnapshot, 96)} alt="customization preview" className="h-16 border border-line bg-white" />
        </div>
      ) : null}
      {typeof cust.customPrintCost === 'number' && cust.customPrintCost > 0 ? (
        <div><b>Print cost:</b> {formatPrice(cust.customPrintCost)}</div>
      ) : null}
    </div>
  );
};

const OrderDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getOrderById(id);
        setOrder(res.data ?? res.order ?? res);
      } catch (e) {
        setError(e.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const updateStatus = async (orderStatus) => {
    setSaving(true);
    try {
      const res = await adminService.updateOrderStatus(id, { orderStatus });
      setOrder((o) => ({ ...(o || {}), ...(res.data ?? res.order ?? { orderStatus }) }));
    } catch {
      /* interceptor shows toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;
  if (error || !order) {
    return (
      <div className="admin-card admin-card-pad">
        <p className="text-danger text-sm">{error || 'Order not found.'}</p>
        <button className="tc-btn-ghost mt-3" onClick={() => navigate('/admin/orders')}>← Back to orders</button>
      </div>
    );
  }

  const items = order.items ?? [];
  const addr = order.shippingAddress || {};

  return (
    <section>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={new Date(order.createdAt).toLocaleString()}
        backTo="orders"
        onBack={() => navigate('/admin/orders')}
        actions={<Badge tone={statusTone(order.orderStatus)}>{order.orderStatus}</Badge>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Items</h3>
            <div className="divide-y divide-line -my-1">
              {items.map((item, i) => {
                const img = imageUrl(item.image, 96);
                const name = item.name || item.product?.name || 'Product';
                return (
                  <div key={i} className="py-3 flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden border border-line bg-canvasd">
                      {img && <img src={img} alt={name} className="h-full w-full object-cover" loading="lazy" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-ink-500 mt-0.5">
                            {[item.size, item.colour?.name].filter(Boolean).join(' · ') || 'Standard'}
                            {item.quantity > 1 ? ` · × ${item.quantity}` : ''}
                          </p>
                        </div>
                        <span className="font-medium text-sm whitespace-nowrap">{formatPrice(item.totalPrice ?? (item.price ?? 0) * (item.quantity ?? 1))}</span>
                      </div>
                      <CustomizationBlock cust={item.customization} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Shipping Address</h3>
            <div className="text-sm text-ink-700 leading-relaxed">
              <p className="font-medium text-ink">{addr.fullName || '—'}</p>
              {addr.phone && <p>{addr.phone}</p>}
              {addr.street && <p>{addr.street}</p>}
              <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')}</p>
              <p className="text-ink-500">{addr.country}</p>
            </div>
          </div>

          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Status history</h3>
            <ol className="space-y-0">
              {(order.statusHistory ?? []).map((h, i) => (
                <li key={i} className="flex gap-3 pb-3 last:pb-0">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${i === (order.statusHistory?.length ?? 1) - 1 ? 'bg-ink-900' : 'bg-ink-200'}`} />
                  <div>
                    <p className="text-sm font-medium">{h.status}</p>
                    <p className="text-xs text-ink-500">
                      {new Date(h.timestamp).toLocaleString()}
                      {h.note ? ` — ${h.note}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Payment</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-ink-500">Method</dt><dd className="font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">Status</dt><dd><Badge tone={order.paymentStatus === 'completed' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'neutral'}>{order.paymentStatus}</Badge></dd></div>
              {order.paymentId && <div className="flex justify-between gap-2"><dt className="text-ink-500 shrink-0">Payment ID</dt><dd className="font-mono text-xs text-right break-all">{order.paymentId}</dd></div>}
              {order.razorpayOrderId && <div className="flex justify-between gap-2"><dt className="text-ink-500 shrink-0">Razorpay order</dt><dd className="font-mono text-xs text-right break-all">{order.razorpayOrderId}</dd></div>}
            </dl>
          </div>

          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Summary</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount {order.couponApplied?.code ? `(${order.couponApplied.code})` : ''}</dt>
                  <dd>−{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{order.shippingCharge === 0 ? 'Free' : formatPrice(order.shippingCharge)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 mt-2"><dt className="font-medium">Total</dt><dd className="font-semibold">{formatPrice(order.totalAmount)}</dd></div>
            </dl>
          </div>

          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Fulfilment</h3>
            <Field label="Order status">
              <select
                className="admin-select"
                value={order.orderStatus}
                disabled={saving}
                onChange={(e) => updateStatus(e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <p className="text-xs text-ink-500 mt-2">
              Payment status updates automatically via Razorpay verification — manage fulfilment here only.
              Cancelling restores reserved stock automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderDetailAdmin;
