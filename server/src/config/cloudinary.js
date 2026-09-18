const { v2: cloudinary } = require('cloudinary');

// Centralized Cloudinary configuration (audit #11/#12):
// - Secret lives ONLY on the server, loaded from environment variables.
// - Assets are organized into identifiable folders.
// - When credentials are absent (local dev), uploads gracefully fall back
//   to local disk storage instead of hard-failing.

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Folder taxonomy (brief #12)
const FOLDERS = {
  PRODUCTS: 'threadcraft/products',
  VARIANTS: 'threadcraft/products/variants',
  BANNERS: 'threadcraft/banners',
  DESIGNS: 'threadcraft/designs',
  CUSTOMIZATION: 'threadcraft/customization'
};

const UPLOAD_FOLDERS = ['products', 'variants', 'banners', 'designs', 'customization'];

/**
 * Upload a local file (already validated & stored on disk by multer) to
 * Cloudinary inside the given folder. Returns { url, publicId }.
 */
const uploadToCloudinary = async (localFilePath, folder = FOLDERS.PRODUCTS) => {
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: 'image',
    overwrite: false
  });
  return { url: result.secure_url, publicId: result.public_id };
};

/**
 * Delete a cloud asset by publicId. Never throws — a failed cleanup must not
 * break the admin operation that triggered it. Skips anything that is not a
 * Cloudinary public id (e.g. legacy local /uploads/... paths or external URLs).
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isConfigured) return;
  if (!String(publicId).startsWith('threadcraft/')) return; // safety: only our assets
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
  }
};

module.exports = {
  cloudinary,
  isConfigured,
  FOLDERS,
  UPLOAD_FOLDERS,
  uploadToCloudinary,
  deleteFromCloudinary
};
