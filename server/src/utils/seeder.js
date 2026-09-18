require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, closeDB } = require('../config/db');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Design = require('../models/Design');
const Coupon = require('../models/Coupon');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Vector graphic designs encoded cleanly as high quality SVGs or curated royalty-free streetwear graphics
const sampleDesigns = [
  {
    name: 'Cyber Samurai Helmet',
    category: 'Cyberpunk',
    tags: ['cyberpunk', 'samurai', 'neon', 'futuristic'],
    price: 99,
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Neo Tokyo Street Kanji',
    category: 'Streetwear',
    tags: ['japanese', 'kanji', 'streetwear', 'tokyo'],
    price: 49,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Golden Tiger Roar Emblem',
    category: 'Streetwear',
    tags: ['tiger', 'wildlife', 'fierce', 'gold'],
    price: 79,
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Retro Sunset Palm Silhouette',
    category: 'Vintage',
    tags: ['retro', 'sunset', '80s', 'synthwave'],
    price: 0,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Great Wave of Kanagawa',
    category: 'Anime',
    tags: ['wave', 'japan', 'art', 'ocean'],
    price: 0,
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Cosmic Astronaut Floating',
    category: 'Abstract',
    tags: ['space', 'astronaut', 'stars', 'galaxy'],
    price: 49,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Geometric Skull & Roses',
    category: 'Streetwear',
    tags: ['skull', 'roses', 'tattoo', 'edgy'],
    price: 69,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Minimalist Line Art Face',
    category: 'Minimalist',
    tags: ['aesthetic', 'minimal', 'lineart', 'portrait'],
    price: 0,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Original NYC Heritage Badge',
    category: 'Badges',
    tags: ['vintage', 'badge', 'athletics', 'heritage'],
    price: 0,
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Dope Typography: ALWAYS DREAMING',
    category: 'Typography',
    tags: ['quote', 'typography', 'inspiration'],
    price: 0,
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=600&q=80'
  }
];

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Purging existing collections...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Design.deleteMany({});
    await Coupon.deleteMany({});
    await Banner.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});

    console.log('👤 Seeding Users (Admin & Customer)...');
    const adminUser = await User.create({
      name: 'ThreadCraft Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@threadcraft.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      phone: '+91 98765 43210',
      role: 'admin',
      addresses: [
        {
          fullName: 'ThreadCraft Studio HQ',
          phone: '+91 98765 43210',
          street: '402 Highline Design Avenue, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true,
          tag: 'Work'
        }
      ]
    });

    const customerUser = await User.create({
      name: 'Aryan Sharma',
      email: 'customer@example.com',
      password: 'Customer@123',
      phone: '+91 91234 56789',
      role: 'customer',
      addresses: [
        {
          fullName: 'Aryan Sharma',
          phone: '+91 91234 56789',
          street: 'Flat 4B, Silver Oak Heights, Sector 45',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122003',
          country: 'India',
          isDefault: true,
          tag: 'Home'
        },
        {
          fullName: 'Aryan Sharma (Office)',
          phone: '+91 91234 56789',
          street: 'DLF Cyber City, Tower 10, 5th Floor',
          city: 'Gurugram',
          state: 'Haryana',
          postalCode: '122002',
          country: 'India',
          isDefault: false,
          tag: 'Work'
        }
      ]
    });

    console.log('📁 Seeding Categories...');
    const categories = await Category.insertMany([
      {
        name: 'T-Shirts',
        slug: 't-shirts',
        description: 'Everyday T-shirts, heavyweight tees, and cotton graphic blanks for streetwear daily wear.',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
        active: true
      },
      {
        name: 'Oversized Streetwear',
        slug: 'oversized-streetwear',
        description: 'Drop shoulder relaxed cut engineered with heavy 240 GSM combed cotton.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        active: true
      },
      {
        name: 'Classic Crew Neck',
        slug: 'classic-crew-neck',
        description: 'Timeless everyday regular fit with double-stitched ribbed collar.',
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        active: true
      },
      {
        name: 'Acid Wash & Vintage',
        slug: 'acid-wash-vintage',
        description: 'Hand-distressed vintage mineral washed tees with textured drape.',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        active: true
      },
      {
        name: 'Heavyweight Hoodies & Sweats',
        slug: 'hoodies-sweats',
        description: 'Plush 380 GSM fleece kangaroo hoodies built for layering.',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        active: true
      },
      {
        name: 'Athletic Performance Tees',
        slug: 'athletic-performance',
        description: 'Moisture-wicking 4-way stretch breathable fabric for gym and movement.',
        image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
        active: true
      }
    ]);

    console.log('🎨 Seeding Graphic Design Library...');
    await Design.insertMany(sampleDesigns);

    console.log('👕 Seeding Products with Variations & Colors...');
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });

    const standardColors = [
      { name: 'Jet Black', hex: '#111827', code: 'BLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
      { name: 'Crisp White', hex: '#F9FAFB', code: 'WHT', mockupFront: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
      { name: 'Washed Navy', hex: '#1E3A8A', code: 'NVY', mockupFront: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80' },
      { name: 'Sage Green', hex: '#4D7C0F', code: 'SGE', mockupFront: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80' },
      { name: 'Crimson Red', hex: '#B91C1C', code: 'RED', mockupFront: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=800&q=80' },
      { name: 'Warm Mocha', hex: '#78350F', code: 'MCH', mockupFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' }
    ];

    const sampleProducts = [
      {
        name: 'Heavyweight Signature Oversized Tee',
        slug: 'heavyweight-signature-oversized-tee',
        description: 'Our flagship 240 GSM combed cotton oversized blank. Features a reinforced 1.25" rib neck, dropped shoulders, and a structured silhouette that holds its boxy drape wash after wash. The ultimate canvas for your custom artwork.',
        category: catMap['oversized-streetwear'],
        basePrice: 999,
        discountPrice: 799,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        availableColours: standardColors,
        stock: 85,
        customizationEnabled: true,
        featured: true,
        rating: 4.9,
        numReviews: 48,
        fabric: '100% Combed Compact Cotton, 240 GSM Bio-Washed',
        fit: 'Boxy Drop-Shoulder Fit',
        shirtType: 'oversized',
        tags: ['oversized', 'streetwear', 'heavyweight', 'bestseller']
      },
      {
        name: 'Essential Premium Crew Neck T-Shirt',
        slug: 'essential-premium-crew-neck-tshirt',
        description: 'An everyday staple engineered from ultra-soft 190 GSM ring-spun cotton. Pre-shrunk for the perfect tailored fit that contours naturally through the chest and shoulders.',
        category: catMap['classic-crew-neck'],
        basePrice: 699,
        discountPrice: 549,
        images: [
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        availableColours: [
          { name: 'Crisp White', hex: '#F9FAFB', code: 'WHT', mockupFront: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
          { name: 'Jet Black', hex: '#111827', code: 'BLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
          { name: 'Charcoal Grey', hex: '#374151', code: 'GRY', mockupFront: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
          { name: 'Washed Navy', hex: '#1E3A8A', code: 'NVY', mockupFront: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 120,
        customizationEnabled: true,
        featured: true,
        rating: 4.7,
        numReviews: 32,
        fabric: '100% Ring-Spun Combed Cotton, 190 GSM',
        fit: 'Standard Regular Fit',
        shirtType: 'casual',
        tags: ['classic', 'basics', 'crew-neck', 'everyday']
      },
      {
        name: 'Vintage Acid Wash Distressed Tee',
        slug: 'vintage-acid-wash-distressed-tee',
        description: 'Individually dyed and acid-washed for a one-of-a-kind vintage fade. High-density DTG print receptive, giving your custom designs an authentic retro tour-merch vibe.',
        category: catMap['acid-wash-vintage'],
        basePrice: 1199,
        discountPrice: 899,
        images: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['M', 'L', 'XL', 'XXL'],
        availableColours: [
          { name: 'Washed Charcoal', hex: '#262626', code: 'WCH', mockupFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' },
          { name: 'Faded Olive', hex: '#3F4632', code: 'FOL', mockupFront: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
          { name: 'Washed Indigo', hex: '#27384E', code: 'WIN', mockupFront: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 24,
        customizationEnabled: true,
        featured: true,
        rating: 4.8,
        numReviews: 19,
        fabric: '100% Mineral-Washed Cotton, 220 GSM',
        fit: 'Relaxed Vintage Fit',
        shirtType: 'casual',
        tags: ['vintage', 'acid-wash', 'retro', 'streetwear']
      },
      {
        name: 'Raw Hem Urban Streetwear Box Tee',
        slug: 'raw-hem-urban-streetwear-box-tee',
        description: 'Modern brutalist streetwear silhouette featuring raw cut edge hems, high neckline, and broad shoulders for an effortlessly stylish drape.',
        category: catMap['oversized-streetwear'],
        basePrice: 1099,
        discountPrice: 849,
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['S', 'M', 'L', 'XL'],
        availableColours: [
          { name: 'Jet Black', hex: '#111827', code: 'BLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
          { name: 'Crisp White', hex: '#F9FAFB', code: 'WHT', mockupFront: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
          { name: 'Desert Sand', hex: '#D7C4A5', code: 'SND', mockupFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 35,
        customizationEnabled: true,
        featured: true,
        rating: 4.6,
        numReviews: 14,
        fabric: '100% Organic Bio-Washed Cotton, 260 GSM',
        fit: 'Boxy Crop & Drop Fit',
        shirtType: 'oversized',
        tags: ['urban', 'raw-hem', 'designer']
      },
      {
        name: 'Heritage Cotton Polo Collar Tee',
        slug: 'heritage-cotton-polo-collar-tee',
        description: 'A clean two-button polo collar cut from breathable 220 GSM pique cotton. Sits between smart and casual — easy with denim, sharper with chinos.',
        category: catMap['classic-crew-neck'],
        basePrice: 899,
        discountPrice: 749,
        images: [
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        availableColours: [
          { name: 'Crisp White', hex: '#F9FAFB', code: 'WHT', mockupFront: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80' },
          { name: 'Jet Black', hex: '#111827', code: 'BLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
          { name: 'Washed Navy', hex: '#1E3A8A', code: 'NVY', mockupFront: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80' },
          { name: 'Sage Green', hex: '#4D7C0F', code: 'SGE', mockupFront: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 42,
        customizationEnabled: true,
        featured: false,
        rating: 4.6,
        numReviews: 21,
        fabric: '100% Pique Cotton, 220 GSM',
        fit: 'Classic Regular Fit',
        shirtType: 'collar',
        tags: ['polo', 'collar', 'smart-casual', 'everyday']
      },
      {
        name: 'ThreadCraft Heavyweight Pullover Hoodie',
        slug: 'threadcraft-heavyweight-pullover-hoodie',
        description: 'Substantial 380 GSM brushed interior fleece hoodie with double-lined hood, seamless kangaroo pocket, and heavy 2x2 ribbing on cuffs and hem.',
        category: catMap['hoodies-sweats'],
        basePrice: 2299,
        discountPrice: 1799,
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['M', 'L', 'XL', 'XXL'],
        availableColours: [
          { name: 'Jet Black', hex: '#111827', code: 'BLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
          { name: 'Heather Grey', hex: '#9CA3AF', code: 'HGR', mockupFront: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
          { name: 'Pine Forest', hex: '#166534', code: 'PNE', mockupFront: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 18,
        customizationEnabled: true,
        featured: true,
        rating: 5.0,
        numReviews: 27,
        fabric: '80% Combed Cotton, 20% Polyester Fleece, 380 GSM',
        fit: 'Comfort Oversized Fit',
        shirtType: 'oversized',
        tags: ['hoodie', 'winter', 'heavyweight']
      },
      {
        name: 'Pro-Breathe Athletic Active Tee',
        slug: 'pro-breathe-athletic-active-tee',
        description: 'Engineered for high exertion. Breathable perforated micro-mesh panels along the flanks offer constant airflow, while anti-odor treatment keeps it fresh all day.',
        category: catMap['athletic-performance'],
        basePrice: 799,
        discountPrice: 599,
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'
        ],
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        availableColours: [
          { name: 'Stealth Black', hex: '#18181B', code: 'SBLK', mockupFront: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80' },
          { name: 'Volt Yellow', hex: '#EAB308', code: 'VOLT', mockupFront: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80' },
          { name: 'Pacific Blue', hex: '#0284C7', code: 'PBLU', mockupFront: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=800&q=80' }
        ],
        stock: 8, // Low stock sample
        customizationEnabled: true,
        featured: false,
        rating: 4.5,
        numReviews: 11,
        fabric: '90% Poly-Spandex Micro-Knit, 160 GSM',
        fit: 'Athletic Fitted',
        shirtType: 'casual',
        tags: ['active', 'gym', 'sports', 'quick-dry']
      }
    ];

    const insertedProducts = await Product.insertMany(sampleProducts);

    console.log('🎟️ Seeding Coupons...');
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderAmount: 499,
        maxDiscountAmount: 200,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 5000,
        active: true
      },
      {
        code: 'FLAT50',
        discountType: 'fixed',
        discountValue: 50,
        minimumOrderAmount: 499,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 1000,
        active: true
      },
      {
        code: 'FESTIVE20',
        discountType: 'percentage',
        discountValue: 20,
        minimumOrderAmount: 999,
        maxDiscountAmount: 500,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 500,
        active: true
      }
    ]);

    console.log('🖼️ Seeding Homepage Banners...');
    await Banner.insertMany([
      {
        title: 'WEAR YOUR IDENTITY',
        subtitle: 'Craft bespoke graphic streetwear with our real-time interactive 2D customizer. Premium 240 GSM combed cotton.',
        badgeText: 'STUDIO COLLECTION 2026',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
        buttonText: 'Start Customizing',
        buttonLink: '/customizer',
        order: 1,
        active: true
      },
      {
        title: 'OVERSIZED STREETWEAR DROPS',
        subtitle: 'Heavyweight luxury silhouettes, dropped shoulders, and durable screen-printed aesthetics.',
        badgeText: 'NEW ARRIVALS',
        image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=80',
        buttonText: 'Explore Catalog',
        buttonLink: '/shop',
        order: 2,
        active: true
      }
    ]);

    console.log('📦 Seeding Sample Initial Orders...');
    const firstProduct = insertedProducts[0];
    await Order.create({
      orderNumber: 'TC-2026-981240',
      user: customerUser._id,
      items: [
        {
          product: firstProduct._id,
          name: firstProduct.name,
          image: firstProduct.images[0],
          quantity: 1,
          size: 'L',
          colour: { name: 'Jet Black', hex: '#111827' },
          price: 848,
          totalPrice: 848,
          customization: {
            isCustomized: true,
            printSide: 'front',
            text: 'TOKYO NIGHTS',
            textProps: {
              fontSize: 34,
              fontFamily: 'Bebas Neue',
              fill: '#FFFFFF',
              align: 'center',
              isBold: true
            },
            selectedDesign: {
              name: 'Neo Tokyo Street Kanji',
              url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
              scale: 1.1,
              x: 50,
              y: 40
            },
            customPrintCost: 49
          }
        }
      ],
      shippingAddress: customerUser.addresses[0],
      subtotal: 848,
      discount: 84,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 764,
      couponApplied: {
        code: 'WELCOME10',
        discountValue: 10,
        discountType: 'percentage'
      },
      paymentStatus: 'completed',
      paymentMethod: 'upi',
      paymentId: 'PAY-1726000000000-4821',
      paymentDetails: {
        transactionId: 'TXN-1726000000000-84AF92',
        paidAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        provider: 'upi'
      },
      orderStatus: 'Shipped',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          note: 'Order placed by customer.'
        },
        {
          status: 'Confirmed',
          timestamp: new Date(Date.now() - 2.8 * 24 * 3600 * 1000),
          note: 'Payment captured and verified. Artwork forwarded to DTG printing floor.'
        },
        {
          status: 'Processing',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          note: 'Custom artwork printed on 240 GSM blank and heat-cured.'
        },
        {
          status: 'Shipped',
          timestamp: new Date(Date.now() - 0.5 * 24 * 3600 * 1000),
          note: 'Dispatched via Bluedart Express Air. Tracking AWB: BD982173491.'
        }
      ]
    });

    console.log('✅ Seed completed successfully!');
    console.log(`
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🌟 ThreadCraft Studio Database Seed Summary:
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      👑 Admin Account:
         Email:    ${adminUser.email}
         Password: Admin@123

      🛍️ Customer Account:
         Email:    ${customerUser.email}
         Password: Customer@123

      👕 Products:      ${insertedProducts.length} items
      🎨 Designs:       ${sampleDesigns.length} graphics
      📁 Categories:    ${categories.length}
      🎟️ Coupons:       WELCOME10, FLAT50, FESTIVE20
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
