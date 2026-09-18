const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
  tag: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your full name'], trim: true },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: { type: String, required: [true, 'Please provide a password'], minlength: 6 },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar: { type: String, default: '' },
  addresses: [addressSchema],
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Brief #46: login lookup index (email already unique-indexed by the field)
userSchema.index({ role: 1, createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Don't leak hashed password in JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
