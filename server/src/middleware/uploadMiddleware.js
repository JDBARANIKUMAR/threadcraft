const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Files are staged in the OS temp directory and shipped to Cloudinary (or kept
// locally in dev when Cloudinary is not configured). Nothing permanent is ever
// written to server/uploads/ from this pipeline anymore.
const tmpDir = path.join(os.tmpdir(), 'threadcraft-uploads');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Security: SVG is intentionally NOT allowed (script injection / stored XSS
// when served same-origin). Only raster print-safe formats are accepted.
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ALLOWED_EXTS = new Set(['.jpeg', '.jpg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeBase = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40) || 'image';
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.has(file.mimetype) && ALLOWED_EXTS.has(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG or WebP images are allowed.'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB, single file
  fileFilter
});

/**
 * Resolve the target Cloudinary folder from ?kind= (products | variants |
 * banners | designs | customization). Unknown kinds default to products.
 */
const folderForKind = (req) => {
  const { cloudinaryConfig } = require('../config/cloudinary');
  const kind = String(req.query.kind || 'products').toLowerCase();
  const map = {
    products: cloudinaryConfig.FOLDERS.PRODUCTS,
    variants: cloudinaryConfig.FOLDERS.VARIANTS,
    banners: cloudinaryConfig.FOLDERS.BANNERS,
    designs: cloudinaryConfig.FOLDERS.DESIGNS,
    customization: cloudinaryConfig.FOLDERS.CUSTOMIZATION
  };
  return map[kind] || cloudinaryConfig.FOLDERS.PRODUCTS;
};

module.exports = { upload, folderForKind };
