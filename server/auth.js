const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In a real deployment this is an environment secret, not a checked-in
// constant, but that's fine for an in-memory course server that resets on
// restart.
const JWT_SECRET = 'kniss-go-dev-secret';
const SESSION_TTL = '30d';
const SIGNUP_TOKEN_TTL = '20m';
const MIN_PASSWORD_LENGTH = 8;

// Phone number is the identity primitive across the whole app, so it's also
// the login handle. It has to canonicalise to ONE value regardless of how
// the same Algerian number is typed, or sign-up and login won't match:
//
//   +213 555 12 34 56   (international, spaced)
//   00213555123456      (international, 00 prefix)
//   0555123456          (local, leading zero)
//
// ...all become "+213555123456". This app is Algeria-only, so a bare number
// with no country context is assumed local/Algerian.
function normalizePhone(raw) {
  if (typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2); // 00213... -> 213...
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`; // 0555... -> 213555...
  if (!digits.startsWith('213')) digits = `213${digits}`; // 555...   -> 213555...
  return `+${digits}`;
}

// A normalised Algerian number is "+213" followed by exactly 9 digits.
// Enforced at sign-up so a mistyped / incomplete number can't create an
// account you then can't log back into (which is exactly what bit a user).
// Normalises first, so it accepts any input format.
function isValidAlgerianPhone(value) {
  return /^\+213\d{9}$/.test(normalizePhone(value));
}

// Math.random is fine for a dev OTP that only ever gets printed to a
// terminal; a real integration would use crypto + an SMS/WhatsApp provider.
function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Short-lived proof that a phone number passed OTP verification. Handed to
// the client on verify, spent when the account is finally created.
function createSignupToken(phone) {
  return jwt.sign({ phone, scope: 'signup' }, JWT_SECRET, { expiresIn: SIGNUP_TOKEN_TTL });
}

function verifySignupToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.scope === 'signup' ? payload : null;
  } catch (error) {
    return null;
  }
}

const ACCOUNT_TYPES = ['individual', 'agency', 'buyer'];

// Shapes and checks the final "complete your profile" payload. Three account
// types share this one flow: Individual and Agency are sellers, Buyer is not
// (no agency name, no listing quota, and POST /properties rejects them, see
// index.js). Throws an Error with .status 400 listing everything that's wrong.
function validateSignup(input = {}) {
  const accountType = ACCOUNT_TYPES.includes(input.accountType) ? input.accountType : 'individual';
  const password = typeof input.password === 'string' ? input.password : '';
  const fullName = (input.fullName || '').trim();
  const agencyName = (input.agencyName || '').trim();
  const monthlyListings = Number.parseInt(input.monthlyListings, 10);

  const errors = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!fullName) errors.push('Your name is required');
  if (accountType === 'agency' && !agencyName) errors.push('Agency name is required');
  if (!input.acceptedTerms) errors.push('You need to accept the terms to continue');

  if (errors.length) {
    const error = new Error(errors.join('. '));
    error.status = 400;
    throw error;
  }

  return {
    accountType,
    password,
    fullName,
    agencyName: accountType === 'agency' ? agencyName : null,
    photo: typeof input.photo === 'string' && input.photo ? input.photo : null,
    monthlyListings:
      accountType !== 'buyer' && Number.isFinite(monthlyListings) && monthlyListings > 0
        ? monthlyListings
        : 0,
    acceptedTerms: true,
  };
}

// One place that turns a plaintext password into a stored hash, used at
// sign-up and by the "update password" flow, so both hash identically.
function hashPassword(password) {
  return bcrypt.hashSync(password || '', 10);
}

function buildUserRecord(validated, phone) {
  const isBuyer = validated.accountType === 'buyer';
  return {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    // role is what the rest of the server gates on (POST /properties,
    // authorization checks); sellerType is only meaningful for sellers.
    role: isBuyer ? 'buyer' : 'seller',
    sellerType: isBuyer ? null : validated.accountType,
    phone,
    passwordHash: hashPassword(validated.password),
    fullName: validated.fullName,
    agencyName: validated.agencyName,
    photo: validated.photo,
    monthlyListings: validated.monthlyListings,
    acceptedTerms: validated.acceptedTerms,
    googleConnected: false,
    favorites: [],
    createdAt: new Date().toISOString(),
  };
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password || '', hash || '');
}

function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: SESSION_TTL });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// The safe-to-send view of a user; never leaks the password hash.
function publicUser(user) {
  return {
    id: user.id,
    role: user.role,
    sellerType: user.sellerType,
    displayName: user.agencyName || user.fullName || 'Kniss Go user',
    fullName: user.fullName,
    agencyName: user.agencyName,
    photo: user.photo,
    monthlyListings: user.monthlyListings,
    googleConnected: user.googleConnected,
    phone: user.phone,
  };
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  normalizePhone,
  isValidAlgerianPhone,
  generateOtpCode,
  createSignupToken,
  verifySignupToken,
  validateSignup,
  buildUserRecord,
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  publicUser,
};
