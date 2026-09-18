import React, { useEffect, useState } from 'react';
import { bannerService } from '../../../services/bannerService';
import { useToast } from '../../../context/ToastContext';
import { imageUrl } from '../../../utils/imageUrl';
import { Badge, EmptyState, Field, ImageUploadField, PageHeader } from './ui';
import './admin.css';

// Matches the Banner schema: title (required), subtitle, badgeText, image,
// buttonText, buttonLink, order, active.
const EMPTY = { title: '', subtitle: '', badgeText: '', image: null, buttonText: '', buttonLink: '/shop', order: 0, active: true };

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { success, error: toastError } = useToast();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerService.getAllBanners();
      setBanners(res.data ?? res.banners ?? res ?? []);
    } catch (e) {
      toastError(e.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      badgeText: b.badgeText || '',
      image: b.image ? { url: b.image, publicId: b.imagePublicId } : null,
      buttonText: b.buttonText || '',
      buttonLink: b.buttonLink || '/shop',
      order: b.order ?? 0,
      active: b.active !== false
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => { setEditingId(null); setForm(EMPTY); setErrors({}); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.image?.url) errs.image = 'Please upload a banner image';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        badgeText: form.badgeText.trim(),
        image: form.image.url,
        imagePublicId: form.image.publicId || '',
        buttonText: form.buttonText.trim(),
        buttonLink: form.buttonLink.trim() || '/shop',
        order: Number(form.order) || 0,
        active: form.active
      };
      if (editingId) {
        await bannerService.updateBanner(editingId, payload);
        success('Banner updated');
      } else {
        await bannerService.createBanner(payload);
        success('Banner created');
      }
      reset();
      await fetchBanners();
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner? The cloud image is removed too.')) return;
    try {
      await bannerService.deleteBanner(id);
      success('Banner deleted');
      if (editingId === id) reset();
      await fetchBanners();
    } catch (e) {
      toastError(e.message || 'Failed to delete banner');
    }
  };

  const toggleActive = async (b) => {
    try {
      await bannerService.updateBanner(b._id, { active: !b.active });
      await fetchBanners();
    } catch (e) {
      toastError(e.message || 'Failed to update banner');
    }
  };

  const sorted = [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section>
      <PageHeader title="Homepage Banners" subtitle="Carousel slides shown on the storefront — lower order numbers appear first" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>
          ) : banners.length === 0 ? (
            <div className="admin-card">
              <EmptyState
                title="No banners yet"
                hint="Add your first carousel slide — the homepage shows it immediately."
              />
            </div>
          ) : (
            sorted.map((b) => {
              const img = imageUrl(b.image, 400);
              return (
                <div key={b._id} className={`admin-card overflow-hidden flex flex-col sm:flex-row ${b.active === false ? 'opacity-60' : ''}`}>
                  <div className="sm:w-56 h-36 sm:h-auto bg-canvasd shrink-0 border-b sm:border-b-0 sm:border-r border-line">
                    {img && <img src={img} alt={b.title || 'banner'} className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{b.title || 'Untitled'}</h3>
                          <Badge tone="neutral">#{(b.order ?? 0) + 1}</Badge>
                          <Badge tone={b.active ? 'success' : 'neutral'}>{b.active ? 'Live' : 'Hidden'}</Badge>
                        </div>
                        {b.subtitle && <p className="text-sm text-ink-500 mt-1 line-clamp-2">{b.subtitle}</p>}
                        {b.buttonText && (
                          <p className="text-xs text-ink-400 mt-1.5">CTA: “{b.buttonText}” → {b.buttonLink || 'no link'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs" onClick={() => startEdit(b)}>Edit</button>
                      <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs" onClick={() => toggleActive(b)}>
                        {b.active ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" className="tc-btn-ghost !py-1 !px-2.5 !text-xs !text-danger" onClick={() => handleDelete(b._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-card admin-card-pad h-fit space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h3 className="admin-card-title">{editingId ? 'Edit banner' : 'New banner'}</h3>
            {editingId && <button type="button" className="tc-link text-xs" onClick={reset}>Cancel</button>}
          </div>
          <Field label="Image" required error={errors.image} hint="Wide images (1600×600+) look best">
            <ImageUploadField value={form.image} onChange={(img) => set({ image: img })} aspect="wide" folder="banners" />
          </Field>
          <Field label="Title" required error={errors.title}>
            <input className="admin-input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Wear Your Story" />
          </Field>
          <Field label="Subtitle">
            <input className="admin-input" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Custom tees, printed on demand" />
          </Field>
          <Field label="Badge text" hint="Small label above the title (optional)">
            <input className="admin-input" value={form.badgeText} onChange={(e) => set({ badgeText: e.target.value })} placeholder="LIMITED DROP" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Button text">
              <input className="admin-input" value={form.buttonText} onChange={(e) => set({ buttonText: e.target.value })} placeholder="Shop now" />
            </Field>
            <Field label="Button link">
              <input className="admin-input" value={form.buttonLink} onChange={(e) => set({ buttonLink: e.target.value })} placeholder="/shop" />
            </Field>
          </div>
          <Field label="Display order" hint="Lower numbers appear first">
            <input className="admin-input" type="number" value={form.order} onChange={(e) => set({ order: e.target.value })} />
          </Field>
          <label className="admin-check">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
            <span>Active (visible on homepage)</span>
          </label>
          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Banner'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminBanners;
