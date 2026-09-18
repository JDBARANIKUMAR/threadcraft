// client/src/components/common/admin/ProductForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { categoryService } from '../../../services/categoryService';
import { productService } from '../../../services/productService';
import { imageUrl } from '../../../utils/imageUrl';
import { Badge, EmptyState, Field, ImageUploadField, PageHeader, Toggle } from './ui';
import './admin.css';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHIRT_TYPES = [
  { value: 'collar', label: 'Collar' },
  { value: 'casual', label: 'Casual' },
  { value: 'oversized', label: 'Oversized' }
];

const emptyVariant = () => ({
  name: '',
  hex: '#111827',
  thumbnail: null, // { url, publicId } | null
  mockup: null,
  images: [],      // [{ url, publicId }]
  stock: '',
  active: true
});

/**
 * Admin form for creating/editing a product: grouped sections, cloud image
 * gallery and the full colour-variant editor (per-colour media, stock, active).
 */
const ProductForm = ({ editMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    basePrice: '',
    discountPrice: '',
    images: [], // [{ url, publicId }]
    availableSizes: ['M', 'L', 'XL'],
    availableColours: [],
    stock: '',
    customizationEnabled: true,
    customizationPrice: '',
    featured: false,
    active: true,
    fabric: '',
    fit: '',
    shirtType: 'casual',
    tags: ''
  });

  useEffect(() => {
    categoryService
      .getAdminCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (editMode && id) {
      productService
        .getProductById(id)
        .then((res) => {
          const p = res.data;
          // Normalize legacy string images into {url} objects
          const normImage = (img) =>
            typeof img === 'string' ? { url: img, publicId: '' } : img;
          setForm({
            name: p.name || '',
            description: p.description || '',
            category: p.category?._id || p.category || '',
            basePrice: p.basePrice ?? '',
            discountPrice: p.discountPrice ?? '',
            images: (p.images || []).map(normImage),
            availableSizes: p.availableSizes?.length ? [...p.availableSizes] : ['M', 'L', 'XL'],
            availableColours: (p.availableColours || []).map((c) => ({
              name: c.name || '',
              hex: c.hex || '#111827',
              code: c.code || '',
              thumbnail: c.thumbnail ? normImage(c.thumbnail) : null,
              mockup: c.mockup ? normImage(c.mockup) : null,
              images: (c.images || []).map(normImage),
              stock: c.stock ?? '',
              active: c.active !== false
            })),
            stock: p.stock ?? '',
            customizationEnabled: p.customizationEnabled !== false,
            customizationPrice: p.customizationPrice ?? '',
            featured: Boolean(p.featured),
            active: p.active !== false,
            fabric: p.fabric || '',
            fit: p.fit || '',
            shirtType: p.shirtType || 'casual',
            tags: p.tags ? p.tags.join(',') : ''
          });
        })
        .catch((e) => setError(e.message || 'Failed to load product'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [editMode, id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleSize = (size) =>
    set((f) => ({
      availableSizes: f.availableSizes.includes(size)
        ? f.availableSizes.filter((s) => s !== size)
        : [...f.availableSizes, size]
    }));

  /* ── Variant editor (live per-card state) ─────────────────────────────── */

  const updateVariant = (idx, patch) =>
    set((f) => {
      const colours = [...f.availableColours];
      colours[idx] = { ...colours[idx], ...patch };
      return { ...f, availableColours: colours };
    });

  const addVariant = () =>
    set((f) => ({ ...f, availableColours: [...f.availableColours, emptyVariant()] }));

  const removeVariant = (idx) =>
    set((f) => ({ ...f, availableColours: f.availableColours.filter((_, i) => i !== idx) }));

  /* ── Gallery reorder / remove ─────────────────────────────────────────── */

  const moveImage = (idx, dir) =>
    set((f) => {
      const images = [...f.images];
      const target = idx + dir;
      if (target < 0 || target >= images.length) return f;
      [images[idx], images[target]] = [images[target], images[idx]];
      return { ...f, images };
    });

  /* ── Submit ───────────────────────────────────────────────────────────── */

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Pick a category';
    if (form.basePrice === '' || Number(form.basePrice) <= 0) errs.basePrice = 'Base price must be greater than 0';
    if (form.discountPrice !== '' && Number(form.discountPrice) >= Number(form.basePrice)) {
      errs.discountPrice = 'Discount price should be lower than base price';
    }
    if (form.availableSizes.length === 0) errs.sizes = 'Select at least one size';
    form.availableColours.forEach((c, i) => {
      if (!c.name.trim()) errs[`variant-${i}`] = 'Colour name is required';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      basePrice: Number(form.basePrice),
      discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice),
      images: form.images.map((img) => img.url).filter(Boolean),
      availableSizes: form.availableSizes,
      availableColours: form.availableColours.map((c) => ({
        name: c.name.trim(),
        hex: c.hex || '#111827',
        thumbnail: c.thumbnail?.url || '',
        mockup: c.mockup?.url || '',
        images: (c.images || []).map((img) => img.url).filter(Boolean),
        stock: c.stock === '' || c.stock === null ? null : Number(c.stock),
        active: c.active
      })),
      stock: form.stock === '' ? 0 : Number(form.stock),
      customizationEnabled: form.customizationEnabled,
      customizationPrice:
        form.customizationPrice === '' || form.customizationPrice === null
          ? null
          : Number(form.customizationPrice),
      featured: form.featured,
      active: form.active,
      fabric: form.fabric,
      fit: form.fit,
      shirtType: form.shirtType,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    };

    try {
      if (editMode) {
        await productService.updateProduct(id, payload);
      } else {
        await productService.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-card admin-card-pad"><span className="tc-spinner" /></div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={editMode ? 'Edit Product' : 'New Product'}
        subtitle="Changes go live on the storefront as soon as you save"
        backTo="products"
        onBack={() => navigate('/admin/products')}
      />

      {error && <div className="admin-alert admin-alert-error mb-5">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-3">
        {/* ── Left column: product info ── */}
        <div className="xl:col-span-2 space-y-5">
          <fieldset className="admin-fieldset">
            <legend>Product Information</legend>
            <div className="space-y-4">
              <Field label="Product Name" required error={errors.name}>
                <input className="admin-input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Classic Oversized T-Shirt" />
              </Field>
              <Field label="Description" required error={errors.description}>
                <textarea className="admin-textarea min-h-[110px] resize-y" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Heavyweight 240 GSM cotton tee with a relaxed streetwear drape…" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category" required error={errors.category}>
                  <select className="admin-select" value={form.category} onChange={(e) => set({ category: e.target.value })}>
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Shirt Type">
                  <select className="admin-select" value={form.shirtType} onChange={(e) => set({ shirtType: e.target.value })}>
                    {SHIRT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Fabric">
                  <input className="admin-input" value={form.fabric} onChange={(e) => set({ fabric: e.target.value })} placeholder="100% Combed Cotton, 240 GSM" />
                </Field>
                <Field label="Fit">
                  <input className="admin-input" value={form.fit} onChange={(e) => set({ fit: e.target.value })} placeholder="Relaxed Streetwear Fit" />
                </Field>
              </div>
            </div>
          </fieldset>

          {/* ── Pricing ── */}
          <fieldset className="admin-fieldset">
            <legend>Pricing</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Base Price (₹)" required error={errors.basePrice}>
                <input className="admin-input" type="number" min="0" value={form.basePrice} onChange={(e) => set({ basePrice: e.target.value })} placeholder="799" />
              </Field>
              <Field label="Discount Price (₹)" error={errors.discountPrice} hint="Leave empty for no discount">
                <input className="admin-input" type="number" min="0" value={form.discountPrice} onChange={(e) => set({ discountPrice: e.target.value })} placeholder="599" />
              </Field>
            </div>
          </fieldset>

          {/* ── Sizes ── */}
          <fieldset className="admin-fieldset">
            <legend>Sizes</legend>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 text-sm font-semibold border transition ${
                    form.availableSizes.includes(size)
                      ? 'bg-ink-900 text-canvas border-ink-900'
                      : 'bg-white text-ink-700 border-line hover:border-ink-900'
                  }`}
                  aria-pressed={form.availableSizes.includes(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {errors.sizes && <span className="admin-field-error">{errors.sizes}</span>}
          </fieldset>

          {/* ── Colour variants ── */}
          <fieldset className="admin-fieldset">
            <legend>Colour Variants</legend>
            <p className="text-xs text-ink-500 -mt-2 mb-4">
              Each colour gets its own images, mockup, stock and visibility. Customers see exactly these swatches.
            </p>

            {form.availableColours.length === 0 ? (
              <div className="mb-4">
                <EmptyState
                  title="No colour variants"
                  hint="Products without variants use the fallback stock below and the gallery images."
                />
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {form.availableColours.map((variant, idx) => (
                  <div key={idx} className="variant-card">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="variant-swatch-preview">
                        <span className="swatch" style={{ background: variant.hex || '#111827' }} />
                        <span className="font-semibold text-sm">
                          {variant.name.trim() || <em className="text-ink-400 not-italic">Unnamed colour</em>}
                        </span>
                        {!variant.active && <Badge tone="neutral">Hidden</Badge>}
                        {variant.stock !== '' && variant.stock !== null && Number(variant.stock) === 0 && (
                          <Badge tone="danger">Out of stock</Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        title="Remove colour"
                        onClick={() => removeVariant(idx)}
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Colour Name" error={errors[`variant-${idx}`]}>
                        <input
                          className="admin-input"
                          value={variant.name}
                          onChange={(e) => updateVariant(idx, { name: e.target.value })}
                          placeholder="Jet Black"
                        />
                      </Field>
                      <Field label="HEX Value">
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(variant.hex) ? variant.hex : '#111827'}
                            onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                            className="w-10 h-[38px] border border-line cursor-pointer bg-white"
                            title="Pick colour"
                            aria-label={`Pick colour for ${variant.name || 'variant'}`}
                          />
                          <input
                            className="admin-input font-mono"
                            value={variant.hex}
                            onChange={(e) => updateVariant(idx, { hex: e.target.value })}
                            placeholder="#111827"
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <Field label="Thumbnail" hint="Small swatch image (shop cards)">
                        <ImageUploadField
                          value={variant.thumbnail}
                          onChange={(img) => updateVariant(idx, { thumbnail: img })}
                          folder="variants"
                        />
                      </Field>
                      <Field label="Mockup" hint="Large image (product page)">
                        <ImageUploadField
                          value={variant.mockup}
                          onChange={(img) => updateVariant(idx, { mockup: img })}
                          folder="variants"
                        />
                      </Field>
                    </div>

                    <div className="mt-3">
                      <Field label="Colour Images" hint="Extra gallery images shown when this colour is selected">
                        <div className="flex flex-wrap items-center gap-2">
                          {(variant.images || []).map((img, ii) => (
                            <span key={ii} className="relative inline-block">
                              <img
                                src={imageUrl(img, 96) || img.url}
                                alt={`${variant.name} view ${ii + 1}`}
                                className="h-12 w-12 object-cover border border-line"
                              />
                              <button
                                type="button"
                                className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 h-[18px] w-[18px] bg-ink-900 text-canvas text-[9px] flex items-center justify-center"
                                onClick={() =>
                                  updateVariant(idx, { images: variant.images.filter((_, k) => k !== ii) })
                                }
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          <ImageUploadField
                            value={null}
                            onChange={(img) => img && updateVariant(idx, { images: [...(variant.images || []), img] })}
                            folder="variants"
                          />
                        </div>
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-3 items-end">
                      <Field label="Stock" hint="Empty = use fallback product stock">
                        <input
                          className="admin-input"
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => updateVariant(idx, { stock: e.target.value })}
                          placeholder="25"
                        />
                      </Field>
                      <div className="pb-1">
                        <Toggle
                          checked={variant.active}
                          onChange={(v) => updateVariant(idx, { active: v })}
                          label="Active (selectable by customers)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="admin-btn admin-btn-secondary" onClick={addVariant}>
              <FaPlus /> Add Colour Variant
            </button>
          </fieldset>

          {/* ── Gallery ── */}
          <fieldset className="admin-fieldset">
            <legend>Product Gallery</legend>
            <p className="text-xs text-ink-500 -mt-2 mb-4">
              Main images for the shop grid and product page. First image is the cover — use the arrows to reorder.
            </p>
            <div className="space-y-2.5">
              {form.images.map((img, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <img
                    src={imageUrl(img, 96) || img.url}
                    alt={`Gallery image ${i + 1}`}
                    className="h-12 w-12 object-cover border border-line bg-canvasd shrink-0"
                  />
                  <input className="admin-input font-mono text-xs flex-1" value={img.url} readOnly />
                  <div className="flex gap-1 shrink-0">
                    <button type="button" className="admin-icon-btn" title="Move up" onClick={() => moveImage(i, -1)} disabled={i === 0}>
                      <FaArrowUp />
                    </button>
                    <button type="button" className="admin-icon-btn" title="Move down" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1}>
                      <FaArrowDown />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-btn danger"
                      title="Remove image"
                      onClick={() => set({ images: form.images.filter((_, k) => k !== i) })}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <div className="max-w-xs">
                <ImageUploadField
                  value={null}
                  onChange={(uploaded) => uploaded && set({ images: [...form.images, uploaded] })}
                  folder="products"
                  hint="Uploads go to Cloudinary · JPEG/PNG/WebP · 10MB"
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* ── Right column: settings sidebar ── */}
        <div className="space-y-5">
          <fieldset className="admin-fieldset">
            <legend>Customization</legend>
            <div className="space-y-4">
              <Toggle
                checked={form.customizationEnabled}
                onChange={(v) => set({ customizationEnabled: v })}
                label="Enable Customization"
              />
              <p className="text-xs text-ink-500 -mt-1">
                Shows the “Customize T-Shirt” button on the product page.
              </p>
              <Field label="Customization price / side (₹)" hint="Empty = use the global setting">
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  value={form.customizationPrice}
                  onChange={(e) => set({ customizationPrice: e.target.value })}
                  placeholder="Global price"
                  disabled={!form.customizationEnabled}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Inventory</legend>
            <Field
              label="Fallback stock (all colours)"
              hint="Used when colour variants have no stock of their own"
            >
              <input
                className="admin-input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set({ stock: e.target.value })}
                placeholder="50"
              />
            </Field>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Status</legend>
            <div className="space-y-3.5">
              <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="Active (visible in shop)" />
              <Toggle checked={form.featured} onChange={(v) => set({ featured: v })} label="Featured product" />
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Tags</legend>
            <Field label="Tags" hint="Comma separated — used by shop search">
              <input className="admin-input" value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="streetwear,summer" />
            </Field>
          </fieldset>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
          {submitting ? (editMode ? 'Saving…' : 'Creating…') : editMode ? 'Save Changes' : 'Create Product'}
        </button>
        <button type="button" className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/products')}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
