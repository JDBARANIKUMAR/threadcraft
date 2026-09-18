import React, { useEffect, useState } from 'react';
import { settingsService } from '../../../services/settingsService';
import { useToast } from '../../../context/ToastContext';
import { Field, PageHeader } from './ui';
import './admin.css';

const AdminSettings = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsService.getSettings();
        const s = res.data ?? res.settings ?? res ?? {};
        setForm({
          customizationPricePerSide: s.customizationPricePerSide ?? 150,
          freeShippingThreshold: s.freeShippingThreshold ?? 999,
          shippingFee: s.shippingFee ?? 99
        });
      } catch (e) {
        toastError(e.message || 'Failed to load settings');
        setForm({ customizationPricePerSide: 150, freeShippingThreshold: 999, shippingFee: 99 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsService.updateSettings(form);
      success('Settings saved');
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;

  return (
    <section>
      <PageHeader title="Settings" subtitle="Global store configuration — the server applies these at checkout immediately" />

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2" noValidate>
        <div className="admin-card admin-card-pad space-y-4">
          <div>
            <h3 className="admin-card-title">Customization pricing</h3>
            <p className="text-xs text-ink-500 mt-1">
              Charged per printed side. Per-product overrides live on each product's form.
            </p>
          </div>
          <Field label="Price per printed side (₹)" required>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={form.customizationPricePerSide}
              onChange={(e) => set({ customizationPricePerSide: e.target.value })}
            />
          </Field>
          <div className="border border-line bg-canvas/60 px-3.5 py-3 text-sm text-ink-700">
            <p className="font-medium mb-1">How customers are charged</p>
            <p className="text-xs text-ink-500 leading-relaxed">
              Front only: ₹{form.customizationPricePerSide} · Back only: ₹{form.customizationPricePerSide} · Front + Back: ₹{(Number(form.customizationPricePerSide) || 0) * 2}
            </p>
          </div>
        </div>

        <div className="admin-card admin-card-pad space-y-4">
          <div>
            <h3 className="admin-card-title">Shipping</h3>
            <p className="text-xs text-ink-500 mt-1">
              The server recomputes these on every checkout — the storefront mirrors them for display only.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Free shipping above (₹)">
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.freeShippingThreshold}
                onChange={(e) => set({ freeShippingThreshold: e.target.value })}
              />
            </Field>
            <Field label="Shipping fee (₹)">
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.shippingFee}
                onChange={(e) => set({ shippingFee: e.target.value })}
              />
            </Field>
          </div>
          <p className="text-xs text-ink-500">
            Orders above ₹{form.freeShippingThreshold} ship free; below that, ₹{form.shippingFee} is added.
          </p>
        </div>

        <div className="lg:col-span-2">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AdminSettings;
