import api from './api';

/**
 * Upload an image via the admin-only /api/designs/upload endpoint.
 *
 * @param {File} file - the image file (JPEG/PNG/WebP, ≤10MB)
 * @param {string} kind - cloud folder kind: products | variants | banners | designs | customization
 * @returns {Promise<{success: boolean, data: {url: string, publicId: string}}>}
 */
export const uploadImage = async (file, kind = 'products') => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.post(`/designs/upload?kind=${encodeURIComponent(kind)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
