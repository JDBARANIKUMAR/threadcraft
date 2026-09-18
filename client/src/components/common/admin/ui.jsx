// client/src/components/common/admin/ui.jsx
import React, { useRef, useState } from 'react';
import { FaUpload, FaTrash, FaSyncAlt } from 'react-icons/fa';
import { uploadImage } from '../../../services/uploadService';
import { imageUrl, resolveImageUrl } from '../../../utils/imageUrl';

// admin.css badges ship as success/warn/danger/neutral/info — map the
// friendlier tone names used across pages onto them.
const TONE_ALIASES = {
  success: 'success',
  danger: 'danger',
  warning: 'warn',
  neutral: 'neutral',
  info: 'info',
  clay: 'info'
};

/** Status/level badge using admin.css token classes. */
export const Badge = ({ tone = 'neutral', children }) => (
  <span className={`badge badge-${TONE_ALIASES[tone] || 'neutral'}`}>{children}</span>
);

/** Section heading block used at the top of admin pages. */
export const PageHeader = ({ title, subtitle, actions, backTo, onBack }) => (
  <div className="admin-toolbar">
    <div className="min-w-0">
      {backTo && (
        <button
          type="button"
          className="tc-link text-xs mb-1 flex items-center gap-1"
          onClick={onBack || (() => { window.history.back(); })}
        >
          ← {backTo}
        </button>
      )}
      <h2 className="admin-section-title">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/** Empty state block for tables/lists. */
export const EmptyState = ({ title, hint, action }) => (
  <div className="admin-empty">
    <p className="font-display text-base font-semibold text-ink-900">{title}</p>
    {hint && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/** ON/OFF toggle switch. */
export const Toggle = ({ checked, onChange, label }) => (
  <label className="admin-check">
    <span className="tc-switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" />
      <span className="switch-thumb" />
    </span>
    {label && <span>{label}</span>}
  </label>
);

/**
 * Labelled form field: label above input (never placeholder-only), inline
 * validation message and optional hint below.
 */
export const Field = ({ label, required, error, hint, children }) => (
  <label className="admin-field block">
    {label && (
      <span className="admin-label">
        {label}
        {required && <span className="text-clay ml-0.5">*</span>}
      </span>
    )}
    {children}
    {error ? (
      <span className="admin-field-error">{error}</span>
    ) : hint ? (
      <span className="admin-field-hint">{hint}</span>
    ) : null}
  </label>
);

/**
 * Cloud image upload tile: click to upload (goes through the admin-only
 * upload endpoint → Cloudinary), shows preview, supports replace + remove.
 * `value` is null | { url, publicId }.
 */
export const ImageUploadField = ({
  value,
  onChange,
  aspect = 'square', // 'square' | 'wide' | 'portrait'
  folder = 'products',
  hint = 'JPEG, PNG or WebP · max 10MB'
}) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const preview = value?.url ? imageUrl(value.url, aspect === 'wide' ? 480 : 240) : null;

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG or WebP images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large — 10MB maximum.');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file, folder);
      onChange({ url: res.data.url, publicId: res.data.publicId || '' });
    } catch (e) {
      setError(e.message || 'Upload failed — please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="upload-tile has-image group relative">
          <img src={preview} alt="Uploaded image preview" />
          <div className="mt-1.5 flex gap-1.5 justify-center">
            <button
              type="button"
              className="tc-btn-ghost !py-1 !px-2 !text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <FaSyncAlt /> Replace
            </button>
            <button
              type="button"
              className="tc-btn-ghost !py-1 !px-2 !text-xs !text-danger"
              onClick={() => onChange(null)}
              disabled={uploading}
            >
              <FaTrash /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="upload-tile"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="tc-spinner !w-4 !h-4" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <FaUpload aria-hidden="true" />
              <span>Click to upload</span>
              <span className="font-normal text-ink-400">{hint}</span>
            </>
          )}
        </button>
      )}

      {error && <span className="admin-field-error">{error}</span>}
    </div>
  );
};

/** Simple pagination footer: "Page x of y · z total" + prev/next. */
export const Pagination = ({ page, pages, total, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="admin-pagination">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          ← Prev
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-ghost"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

/** Money cell formatted in INR. */
export const Money = ({ value }) => (
  <span>
    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0)}
  </span>
);
