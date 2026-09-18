const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const designRoutes = require('./routes/designRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
app.set('trust proxy', 1); // correct client IPs behind Netlify/hosting proxies

const isProd = process.env.NODE_ENV === 'production';

// ── Security headers (brief #32) ──────────────────────────────────────────
// CSP is intentionally not forced globally: the SPA is served by Netlify, and
// Razorpay Checkout injects scripts/iframes into the payment window. Helmet's
// sensible defaults cover X-Content-Type-Options, Referrer-Policy, frame
// protection and HSTS (behind TLS) without breaking those integrations.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // images served cross-origin
    contentSecurityPolicy: false
  })
);

// ── CORS: only trusted origins ────────────────────────────────────────────
// CLIENT_URL may hold a single origin or a comma-separated list. In
// development all origins are allowed for convenience; production fails
// closed (no wildcard reflection) when CLIENT_URL is not configured.
const allowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!isProd) return callback(null, true); // dev convenience (Vite proxy + tooling)
    if (!origin) return callback(null, true); // curl / server-to-server (webhooks)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors(corsOptions));

// ── Rate limiting (brief #33) — targeted, never breaks normal shopping ────
const limiter = (windowMs, max) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });

// Brute-force protection on credential + payment endpoints
app.use('/api/auth/login', limiter(15 * 60 * 1000, 30)); // 30 login attempts / 15 min
app.use('/api/auth/register', limiter(60 * 60 * 1000, 20));
app.use('/api/payment', limiter(60 * 1000, 60)); // payment calls stay smooth
app.use('/api/designs/upload', limiter(60 * 60 * 1000, 100)); // upload abuse cap

// Gentle cap on public catalog reads (per IP, generous for real shoppers)
app.use('/api', limiter(60 * 1000, 600));

// Raw body capture for Razorpay webhook signature verification.
// Must run BEFORE express.json so we retain the exact bytes Razorpay signed.
app.use('/api/payment/webhook', express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Body parser (50mb accommodates canvas design snapshots)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (!isProd) {
  app.use(morgan('dev'));
}

// Dev-only static fallback for images uploaded without Cloudinary configured.
// In production, Cloudinary serves all assets and this is not mounted.
if (!isProd) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    brand: 'THREADCRAFT STUDIO',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
