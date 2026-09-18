/* eslint-disable no-console */
/**
 * Acceptance test harness — boots the real Express app against an ISOLATED
 * throwaway MongoDB database (threadcraft_acceptance_test), seeds test data,
 * and runs the acceptance checks from the implementation brief.
 *
 * Run:  node acceptance-test.js
 * Requires: local MongoDB on :27017 (the app's normal dev dependency).
 */
process.env.JWT_SECRET = 'test_secret_key_min_16_chars!!';
process.env.NODE_ENV = 'test';
// Isolated throwaway DB — never touches threadcraft_custom_tshirts
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/threadcraft_acceptance_test';

const http = require('http');
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('./src/config/db');
const app = require('./src/app');

const BASE = 'http://127.0.0.1:5100';
let pass = 0;
let fail = 0;

const ok = (name, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ''}`);
  }
};

const req = (path, { method = 'GET', body, token } = {}) =>
  new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers.Authorization = `Bearer ${token}`;
    const r = http.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, json: null, raw });
        }
      });
    });
    r.on('error', (e) => resolve({ status: 0, json: null, raw: e.message }));
    if (data) r.write(data);
    r.end();
  });

(async () => {
  // Start from a clean throwaway database
  await mongoose.connect(process.env.MONGO_URI).catch(() => {});
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  await connectDB();

  const User = require('./src/models/User');
  const Category = require('./src/models/Category');
  const Product = require('./src/models/Product');
  const Banner = require('./src/models/Banner');
  const Design = require('./src/models/Design');
  const Coupon = require('./src/models/Coupon');
  const Settings = require('./src/models/Settings');

  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
  await User.create({ name: 'Cust', email: 'cust@test.com', password: 'Cust@123', role: 'customer' });
  const cat = await Category.create({ name: 'Oversized T-Shirts' });
  const cat2 = await Category.create({ name: 'Full Sleeve T-Shirts' });

  const product = await Product.create({
    name: 'Classic Oversized Tee', description: 'Boxy fit tee', category: cat._id,
    basePrice: 999, discountPrice: 799, stock: 100,
    availableSizes: ['S', 'M', 'L', 'XL'],
    availableColours: [
      { name: 'Black', hex: '#111111', stock: 5 },
      { name: 'White', hex: '#ffffff', stock: 10 },
      { name: 'Red', hex: '#ff0000', stock: 0 }
    ],
    customizationEnabled: true, customizationPrice: 150
  });
  await Product.create({
    name: 'Full Sleeve Tee', description: 'Long sleeves', category: cat2._id,
    basePrice: 1199, stock: 5, availableSizes: ['M', 'L'],
    availableColours: [{ name: 'Navy', hex: '#000080', stock: 3 }],
    customizationEnabled: false
  });
  await Banner.create({ title: 'Drop One', image: '/uploads/a.png', order: 1 });
  await Design.create({ name: 'Test Graphic', image: '/uploads/d.png', category: 'Streetwear' });
  await Coupon.create({ code: 'TEST10', discountType: 'percentage', discountValue: 10, expiryDate: new Date('2030-01-01') });
  await Settings.get();

  const server = app.listen(5100);
  await new Promise((r) => server.on('listening', r));

  const adminLogin = await req('/api/auth/login', { method: 'POST', body: { email: 'admin@test.com', password: 'Admin@123' } });
  const adminToken = adminLogin.json?.data?.token;
  const custLogin = await req('/api/auth/login', { method: 'POST', body: { email: 'cust@test.com', password: 'Cust@123' } });
  const custToken = custLogin.json?.data?.token;
  ok('Admin + customer logins', !!adminToken && !!custToken);

  const pid = product._id.toString();

  console.log('\n— Homepage / categories —');
  let r = await req('/api/categories');
  ok('T1 new category served by GET /api/categories', r.json?.data?.some((c) => c.slug === cat.slug));
  ok('T1b banners endpoint serves active banner', (await req('/api/banners')).json?.data?.length === 1);

  console.log('\n— Shop —');
  r = await req(`/api/products?category=${cat.slug}`);
  ok('T2 category filter returns only that category', r.json?.data?.length === 1 && r.json.data[0].name === 'Classic Oversized Tee');
  r = await req('/api/products?search=Full+Sleeve');
  ok('T2b search works', r.json?.data?.length === 1);
  r = await req('/api/products?sort=price-low');
  ok('T2c sort price-low', r.json?.data?.[0]?.basePrice === 999);

  console.log('\n— Product page / variants —');
  r = await req(`/api/products/${pid}`);
  ok('T3 product exposes 3 colour variants', r.json?.data?.availableColours?.length === 3);
  ok('T4 variant image fields present', 'thumbnail' in r.json.data.availableColours[0] && 'mockup' in r.json.data.availableColours[0]);

  console.log('\n— Admin-driven changes —');
  const colours = r.json.data.availableColours.map((c) => (c.name === 'Black' ? { ...c, active: false } : c));
  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { availableColours: colours } });
  r = await req(`/api/products/${pid}`);
  ok('T5 disabled variant flagged inactive in API', r.json?.data?.availableColours?.find((c) => c.name === 'Black')?.active === false);
  let pr = await req('/api/cart', { method: 'POST', token: custToken, body: { productId: pid, size: 'M', colour: { name: 'Black', hex: '#111111' }, quantity: 1 } });
  ok('T5b disabled variant rejected at cart', pr.status === 400);

  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { discountPrice: 749 } });
  r = await req(`/api/products/${pid}`);
  ok('T6 price change reflected', r.json?.data?.discountPrice === 749);

  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { stock: 42 } });
  r = await req(`/api/products/${pid}`);
  ok('T7 stock change reflected', r.json?.data?.stock === 42);

  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { customizationEnabled: false } });
  r = await req(`/api/products/${pid}`);
  ok('T8 customization disabled flag served', r.json?.data?.customizationEnabled === false);
  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { customizationEnabled: true } });

  await req('/api/designs', { method: 'POST', token: adminToken, body: { name: 'New Drop Graphic', image: '/uploads/n.png', category: 'Anime' } });
  r = await req('/api/designs');
  ok('T10 new design in public design library', r.json?.data?.some((d) => d.name === 'New Drop Graphic'));

  const nb = await req('/api/banners', { method: 'POST', token: adminToken, body: { title: 'Second Banner', image: '/uploads/b.png', order: 2 } });
  ok('T11 admin can add banner', nb.status === 201);
  r = await req('/api/banners');
  ok('T11b banner appears publicly', r.json?.data?.length === 2);
  await req(`/api/banners/${nb.json.data._id}`, { method: 'PUT', token: adminToken, body: { active: false } });
  r = await req('/api/banners');
  ok('T12 disabled banner disappears', r.json?.data?.length === 1);

  console.log('\n— Cart & pricing integrity —');
  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { discountPrice: 799 } });

  pr = await req('/api/cart', { method: 'POST', token: custToken, body: { productId: pid, size: 'M', colour: { name: 'White', hex: '#ffffff' }, quantity: 2 } });
  ok('T15 normal add-to-cart priced by server (799×2)', pr.json?.data?.items?.[0]?.price === 799 && pr.json?.data?.items?.[0]?.quantity === 2);

  pr = await req('/api/cart', { method: 'POST', token: custToken, body: {
    productId: pid, size: 'L', colour: { name: 'White', hex: '#ffffff' }, quantity: 1,
    customization: { isCustomized: true, frontElements: [{ id: 'x' }], customPrintCost: 999999 }
  } });
  ok('T15b customized add: server sets print cost 150 (ignores client 999999)', pr.json?.data?.items?.some((i) => i.customization?.customPrintCost === 150));
  ok('T15c customized add: unit price 949', pr.json?.data?.items?.some((i) => i.price === 949));

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'M', colour: { name: 'White', hex: '#ffffff' }, quantity: 1, price: 1, customization: { isCustomized: false } }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('T16 server ignores client price (order unit = 799, total = 799+99 ship)', pr.json?.data?.items?.[0]?.price === 799 && pr.json?.data?.totalAmount === 898);

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'M', colour: { name: 'Red', hex: '#ff0000' }, quantity: 1 }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('T17 out-of-stock variant rejected', pr.status === 400 && /stock/i.test(pr.json?.message || ''));

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'M', colour: { name: 'Black', hex: '#111111' }, quantity: 6 }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('T17b over-variant-stock rejected', pr.status === 400);

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'XXL', colour: { name: 'White', hex: '#ffffff' }, quantity: 1 }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('T17c invalid size rejected', pr.status === 400);

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'L', colour: { name: 'White', hex: '#ffffff' }, quantity: 1,
      customization: { isCustomized: true, frontElements: [{ id: 'el1', type: 'text', text: 'HELLO' }], backElements: [], text: 'HELLO' } }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  const item = pr.json?.data?.items?.[0];
  ok('T15d order preserves variant+size+customization', item?.colour?.name === 'White' && item?.size === 'L' && item?.customization?.frontElements?.[0]?.text === 'HELLO' && item?.price === 949);
  const orderId = pr.json?.data?._id;

  console.log('\n— Security —');
  r = await req('/api/admin/dashboard');
  ok('T18 admin API blocked without token', r.status === 401);
  r = await req('/api/admin/dashboard', { token: custToken });
  ok('T18b admin API blocked for customer', r.status === 403);

  r = await req('/api/designs/upload', { method: 'POST' });
  ok('T19 anonymous upload blocked', r.status === 401);
  r = await req('/api/designs/upload', { method: 'POST', token: custToken });
  ok('T19b customer upload blocked', r.status === 403);

  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: 'custom-round_neck', size: 'M', quantity: 1 }],
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('T20-pre fake product id rejected (customizer bug fixed)', pr.status === 404);

  // Coupon: 10% off 1598 = 160 discount; subtotal > 999 so shipping is free → total 1438
  pr = await req('/api/orders', { method: 'POST', token: custToken, body: {
    items: [{ product: pid, size: 'M', colour: { name: 'White', hex: '#ffffff' }, quantity: 2 }],
    couponCode: 'test10',
    shippingAddress: { fullName: 'C', phone: '1', street: 's', city: 'c', state: 'st', postalCode: '560001' }
  } });
  ok('Coupon applied server-side (10% off 1598 = 160, free ship, total 1438)', pr.json?.data?.discount === 160 && pr.json?.data?.totalAmount === 1438, `status=${pr.status} msg=${pr.json?.message} discount=${pr.json?.data?.discount} total=${pr.json?.data?.totalAmount}`);

  r = await req('/api/payment/verify', { method: 'POST', token: custToken, body: { orderId, razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' } });
  ok('T20 payment verify without keys fails safely (500 w/ message)', r.status === 500 && /Razorpay keys/i.test(r.json?.message || ''));

  await req(`/api/products/${pid}`, { method: 'PUT', token: adminToken, body: { active: false } });
  r = await req(`/api/products/${pid}`);
  ok('T21 inactive product hidden from customers', r.status === 404);
  r = await req(`/api/products/${pid}`, { token: adminToken });
  ok('T21b inactive product visible to admin', r.status === 200 && r.json?.data?.active === false);

  r = await req('/api/settings');
  ok('Settings public read', r.json?.data?.customizationPricePerSide === 150);
  r = await req('/api/settings', { method: 'PUT', body: { customizationPricePerSide: 200 } });
  ok('Settings update requires admin', r.status === 401);
  r = await req('/api/settings', { method: 'PUT', token: adminToken, body: { customizationPricePerSide: 200 } });
  ok('Settings admin update works', r.json?.data?.customizationPricePerSide === 200);

  console.log(`\n━━━ RESULT: ${pass} passed, ${fail} failed ━━━`);
  server.close();
  await mongoose.connect(process.env.MONGO_URI).catch(() => {});
  await mongoose.connection.dropDatabase().catch(() => {}); // leave nothing behind
  await closeDB();
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
});
