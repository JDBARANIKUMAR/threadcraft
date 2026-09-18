const jwt = require('jsonwebtoken');

// JWT_SECRET is REQUIRED. We fail fast at startup instead of silently signing
// tokens with a guessable default (audit finding: hardcoded fallback secret).
const requiredSecret = process.env.JWT_SECRET;

if (!requiredSecret || String(requiredSecret).trim().length < 16) {
  console.error(
    '[FATAL] JWT_SECRET is missing or too short (min 16 chars). ' +
    'Set it in server/.env and restart. Refusing to start with an insecure default.'
  );
  process.exit(1);
}

const JWT_SECRET = requiredSecret;

const generateToken = (id, role = 'customer') => {
  return jwt.sign(
    { id, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { generateToken, JWT_SECRET };
