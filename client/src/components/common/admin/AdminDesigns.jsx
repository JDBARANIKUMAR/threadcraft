import React, { useEffect, useState } from 'react';
import { designService } from '../../../services/designService';
import { useToast } from '../../../context/ToastContext';
import { imageUrl } from '../../../utils/imageUrl';
import { Badge, EmptyState, Field, ImageUploadField, PageHeader } from './ui';
import './admin.css';

// Matches the Design schema enum
const DESIGN_CATEGORIES = ['Streetwear', 'Typography', 'Anime', 'Vintage', 'Minimalist', 'Cyberpunk', 'Badges', 'Abstract'];
const EMPTY = { name: '', category: 'Streetwear', image: null, price: '', active: true };

const AdminDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { success, error: toastError } = useToast();

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const res = await designService.getAdminDesigns();
      setDesigns(res.data ?? res.designs ?? res ?? []);
    } catch (e) {
      toastError(e.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDesigns(); }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (d) => {
    setEditingId(d._id);
    setForm({
      name: d.name || '',
      category: d.category || 'Streetwear',
      image: d.image ? { url: d.image, publicId: d.imagePublicId } : null,
      price: d.price || '',
      active: d.active !== false
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setEditingId(null); setForm(EMPTY); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Design name is required';
    if (!form.image?.url) errs.image = 'Please upload the artwork';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        image: form.image.url,
        imagePublicId: form.image.publicId || '',
        price: form.price ? Number(form.price) : 0, // 0 = free graphic
        active: form.active
      };
      if (editingId) {
        await designService.updateDesign(editingId, payload);
        success('Design updated');
      } else {
        await designService.createDesign(payload);
        success('Design created');
      }
      reset();
      await fetchDesigns();
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this design? The cloud image is removed too.')) return;
    try {
      await designService.deleteDesign(id);
      success('Design deleted');
      if (editingId === id) reset();
      await fetchDesigns();
    } catch (e) {
      toastError(e.message || 'Failed to delete design');
    }
  };

  return (
    <section>
      <PageHeader title="Designs" subtitle="Graphics available in the customer customizer" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
          ) : designs.length === 0 ? (
            <div className="admin-card">
              <EmptyState
                title="No designs yet"
                hint="Upload graphics customers can drag onto their T-shirt in the studio."
              />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {designs.map((d) => {
                const img = imageUrl(d.image, 200);
                return (
                  <div key={d._id} className={`admin-card overflow-hidden ${d.active === false ? 'opacity-60' : ''}`}>
                    <div className="aspect-square bg-canvasd border-b border-line relative checker-bg">
                      {img ? (
                        <img src={img} alt={d.name} className="h-full w-full object-contain p-2" loading="lazy" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-ink-400">No image</div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {d.price > 0 ? <Badge tone="clay">₹{d.price}</Badge> : <Badge tone="neutral">Free</Badge>}
                        {d.active === false && <Badge tone="danger">Off</Badge>}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-ink-500">{d.category}</p>
                      <div className="flex gap-1.5 mt-2.5">
                        <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs flex-1" onClick={() => startEdit(d)}>Edit</button>
                        <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs !text-danger" onClick={() => handleDelete(d._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-card admin-card-pad h-fit space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="admin-card-title">{editingId ? 'Edit design' : 'Add design'}</h3>
            {editingId && <button type="button" className="tc-link text-xs" onClick={reset}>Cancel</button>}
          </div>
          <Field label="Name" required error={errors.name}>
            <input className="admin-input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Retro Sunburst" />
          </Field>
          <Field label="Category">
            <select className="admin-select" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {DESIGN_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Artwork" required error={errors.image} hint="PNG or WebP with transparency works best">
            <ImageUploadField value={form.image} onChange={(img) => set({ image: img })} aspect="square" folder="designs" />
          </Field>
          <Field label="Extra price (₹)" hint="0 = free graphic — the print cost is separate">
            <input className="admin-input" type="number" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} />
          </Field>
          <label className="admin-check">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
            <span>Active (visible in customizer)</span>
          </label>
          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Design'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminDesigns;
