const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';

// Brief #24: production MUST have a real MongoDB URI. Fail clearly instead of
// silently booting an empty in-memory database.
if (isProd && !process.env.MONGO_URI) {
  console.error(
    '[FATAL] NODE_ENV=production requires MONGO_URI (MongoDB Atlas connection string). ' +
    'Refusing to start against an unknown database.'
  );
  process.exit(1);
}

const { connectDB } = require('./config/db');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port} (${process.env.NODE_ENV || 'development'})`);
    console.log(`Razorpay key loaded: ${process.env.RAZORPAY_KEY_ID ? 'yes' : 'no'}`);
    console.log(`Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME ? 'yes' : 'no (dev local-disk fallback)'}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} already in use, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

connectDB()
  .then(() => startServer(PORT))
  .catch((err) => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });
