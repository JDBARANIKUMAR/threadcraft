/**
 * Centralized image URL helper (briefs #20/#42).
 *
 * - Cloudinary URLs get responsive transformation parameters appended
 *   (small images for cards, larger for detail pages) via f_auto/q_auto.
 * - Legacy local `/uploads/...` paths pass through untouched (dev only).
 * - External URLs pass through untouched.
 * - Empty/invalid values return null so callers can render a clean fallback
 *   tile instead of a broken <img>.
 */

const isCloudinary = (url) => typeof url === 'string' && url.includes('res.cloudinary.com');

const isLocalUpload = (url) => typeof url === 'string' && url.startsWith('/uploads/');

const isUsable = (url) =>
  typeof url === 'string' &&
  url.trim() !== '' &&
  (/^https?:\/\//.test(url) || isLocalUpload(url));

/**
 * Normalize a stored image value into a plain URL string.
 * Values may be: string URL, { url, publicId, alt }, or legacy mockup paths.
 */
export const resolveImageUrl = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.url === 'string') return value.url;
  return '';
};

/**
 * Return an optimized display URL for the given width, or null when the
 * value is not a usable image URL.
 */
export const imageUrl = (value, width = 800) => {
  const url = resolveImageUrl(value);
  if (!isUsable(url)) return null;

  if (isCloudinary(url)) {
    // Insert a transformation segment: f_auto,q_auto,w_<width>,c_limit
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  return url;
};

/** Alt text helper — falls back to a readable generic label. */
export const imageAlt = (value, fallback = 'Product image') => {
  if (value && typeof value === 'object' && value.alt) return value.alt;
  return fallback;
};
