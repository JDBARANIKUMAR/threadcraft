import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryService } from '../../../services/categoryService';
import { useToast } from '../../../context/ToastContext';
import { Field, ImageUploadField, PageHeader } from './ui';
import './admin.css';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');

const CategoryForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ name: '', slug: '', description: '', image: null, active: true });
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await categoryService.getCategory(id);
        const c = res.data ?? res;
        setForm({
          name: c.name || '',
          slug: c.slug || '',
          description: c.description || '',
          image: c.image ? { url: c.image } : null,
          active: c.active !== false,
        });
        setSlugTouched(true);
      } catch (e) {
        toastError(e.message || 'Failed to load category');
        navigate('/admin/categories');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Lowercase letters, numbers and dashes only';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        description: form.description.trim(),
        image: form.image?.url || null,
        imagePublicId: form.image?.publicId || undefined,
        active: form.active,
      };
      if (isEdit) {
        await categoryService.updateCategory(id, payload);
        success('Category updated');
      } else {
        await categoryService.createCategory(payload);
        success('Category created');
      }
      navigate('/admin/categories');
    } catch (err) {
      toastError(err.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={isEdit ? 'Edit Category' : 'New Category'}
        subtitle="Categories appear on the homepage and filter the shop"
        backTo="categories"
        onBack={() => navigate('/admin/categories')}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="admin-card admin-card-pad lg:col-span-2 space-y-5">
          <Field label="Name" required error={errors.name}>
            <input
              className="admin-input"
              value={form.name}
              onChange={(e) => {
                set({ name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) });
              }}
              placeholder="Oversized T-Shirts"
            />
          </Field>
          <Field label="Slug" hint="Used in URLs like /shop/oversized-tshirts" error={errors.slug}>
            <input
              className="admin-input font-mono text-sm"
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="admin-textarea min-h-[90px] resize-y"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="A short description shown with the category…"
            />
          </Field>
        </div>

        <div className="space-y-5">
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Image</h3>
            <ImageUploadField
              value={form.image}
              onChange={(img) => set({ image: img })}
              aspect="square"
              folder="categories"
            />
            <p className="admin-field-hint">Shown on the homepage category card</p>
          </div>
          <div className="admin-card admin-card-pad">
            <h3 className="admin-card-title mb-4">Visibility</h3>
            <label className="admin-check justify-between w-full">
              <span>Active</span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set({ active: e.target.checked })}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
        </button>
        <button type="button" className="admin-btn" onClick={() => navigate('/admin/categories')}>Cancel</button>
      </div>
    </form>
  );
};

export default CategoryForm;
