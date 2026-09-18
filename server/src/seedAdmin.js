require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Security (audit): admin credentials come from the environment, never hardcoded.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threadcraft_custom_tshirts';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error(
    '[FATAL] Refusing to create an admin with weak/missing credentials.\n' +
    'Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in server/.env first.'
  );
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
        console.log(`Existing user ${ADMIN_EMAIL} promoted to admin.`);
      } else {
        console.log('Admin user already exists');
      }
    } else {
      const admin = new User({
        name: 'Store Administrator',
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD, // hashed by the pre-save hook
        role: 'admin',
        active: true
      });
      await admin.save();
      console.log('Admin user created with email:', ADMIN_EMAIL);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
