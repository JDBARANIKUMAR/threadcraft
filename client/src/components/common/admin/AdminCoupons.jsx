import React, { useEffect, useState } from 'react';
import { couponService } from '../../../services/couponService';
import { useToast } from '../../../context/ToastContext';
import { Badge, EmptyState, Field, PageHeader } from './ui';
import './admin.css';

// Matches the Coupon schema: discountType percentage|fixed, minimumOrderAmount,
// maxDiscountAmount, expiryDate (required), usageLimit, active.
const EMPTY = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minimumOrderAmount: '',
  maxDiscountAmount: '',
  expiryDate: '',
  usageLimit: '',
  active: true
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { success, error: toastError } = useToast();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponService.getAllCoupons();
      setCoupons(res.data ?? res.coupons ?? []);
    } catch (e) {
      toastError(e.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code || '',
      discountType: c.discountType || 'percentage',
      discountValue: c.discountValue ?? '',
      minimumOrderAmount: c.minimumOrderAmount ?? '',
      maxDiscountAmount: c.maxDiscountAmount ?? '',
      expiryDate: c.expiryDate ? String(c.expiryDate).slice(0, 10) : '',
      usageLimit: c.usageLimit ?? '',
      active: c.active !== false
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setEditingId(null); setForm(EMPTY); setErrors({}); };

  const validate = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.discountValue || Number(form.discountValue) <= 0) errs.discountValue = 'Discount value must be greater than 0';
    if (!form.expiryDate) errs.expiryDate = 'Expiry date is required';
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) errs.discountValue = 'Percentage cannot exceed 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : 0,
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 1000,
        active: form.active
      };
      if (editingId) {
        await couponService.updateCoupon(editingId, payload);
        success('Coupon updated');
      } else {
        await couponService.createCoupon(payload);
        success('Coupon created');
      }
      reset();
      await fetchCoupons();
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? Customers will no longer be able to apply it.')) return;
    try {
      await couponService.deleteCoupon(id);
      success('Coupon deleted');
      if (editingId === id) reset();
      await fetchCoupons();
    } catch (e) {
      toastError(e.message || 'Failed to delete coupon');
    }
  };

  const isExpired = (c) => c.expiryDate && new Date(c.expiryDate) < new Date();

  return (
    <section>
      <PageHeader title="Coupons" subtitle="Discount codes customers can apply at checkout" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
          ) : coupons.length === 0 ? (
            <div className="admin-card">
              <EmptyState title="No coupons yet" hint="Create your first discount code with the form." />
            </div>
          ) : (
            <div className="admin-card admin-card-pad">
              <div className="divide-y divide-line -my-1">
                {coupons.map((c) => (
                  <div key={c._id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="font-mono text-sm font-semibold tracking-wide bg-canvasd text-ink px-2 py-0.5">{c.code}</code>
                        {c.active && !isExpired(c)
                          ? <Badge tone="success">Active</Badge>
                          : isExpired(c) ? <Badge tone="danger">Expired</Badge>
                          : <Badge tone="neutral">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-ink-500 mt-1.5">
                        {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                        {c.minimumOrderAmount ? ` · min ₹${c.minimumOrderAmount}` : ''}
                        {c.maxDiscountAmount ? ` · capped at ₹${c.maxDiscountAmount}` : ''}
                        {c.expiryDate ? ` · expires ${new Date(c.expiryDate).toLocaleDateString()}` : ''}
                        {` · used ${c.usedCount ?? 0}/${c.usageLimit ?? '∞'}`}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs" onClick={() => startEdit(c)}>Edit</button>
                      <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs !text-danger" onClick={() => handleDelete(c._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-card admin-card-pad h-fit space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="admin-card-title">{editingId ? 'Edit coupon' : 'New coupon'}</h3>
            {editingId && <button type="button" className="tc-link text-xs" onClick={reset}>Cancel</button>}
          </div>
          <Field label="Code" required error={errors.code}>
            <input className="admin-input font-mono uppercase" value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
          </Field>
          <Field label="Type">
            <select className="admin-select" value={form.discountType} onChange={(e) => set({ discountType: e.target.value })}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={form.discountType === 'percentage' ? 'Percent off' : 'Amount off (₹)'} required error={errors.discountValue}>
              <input className="admin-input" type="number" min="0" value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
            </Field>
            <Field label="Min order (₹)">
              <input className="admin-input" type="number" min="0" value={form.minimumOrderAmount} onChange={(e) => set({ minimumOrderAmount: e.target.value })} />
            </Field>
          </div>
          {form.discountType === 'percentage' && (
            <Field label="Max discount (₹)" hint="0 = no cap">
              <input className="admin-input" type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => set({ maxDiscountAmount: e.target.value })} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry date" required error={errors.expiryDate}>
              <input className="admin-input" type="date" value={form.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
            </Field>
            <Field label="Usage limit">
              <input className="admin-input" type="number" min="1" value={form.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} placeholder="1000" />
            </Field>
          </div>
          <label className="admin-check">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
            <span>Active</span>
          </label>
          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminCoupons;
