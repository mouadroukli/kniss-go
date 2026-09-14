const express = require('express');
const cors = require('cors');
const { distanceInMeters } = require('./distance');
const { PROPERTIES, addProperty, reassignOwner } = require('./properties');
const { persist } = require('./db');
const { buildNewProperty } = require('./createProperty');
const {
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
} = require('./auth');
const { setOtp, checkOtp } = require('./otpStore');
const {
  recordInterest,
  interestsForOwner,
  reassignOwner: reassignInterestOwner,
} = require('./interestStore');
const { findByPhone, findById, addUser } = require('./users');
const { deleteAccount } = require('./account');

const app = express();
app.use(cors());
// Listing and profile photos travel as base64 data URIs in the JSON body,
// well past Express's 100kb default. The client downscales listing photos
// before sending, so this is headroom, not the expected size.
app.use(express.json({ limit: '15mb' }));

// Auth.

// Pulls the user off a "Authorization: Bearer <token>" header, or null.
function authenticate(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return findById(payload.sub) || null;
}

// There's no real SMS/WhatsApp provider, so the code is generated for real
// then printed to this terminal instead of sent. The app tells the user to
// look here, so the limitation is honest rather than a silent fake.
app.post('/auth/otp/request', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const channel = req.body.channel === 'sms' ? 'sms' : 'whatsapp';
  if (!phone) return res.status(400).json({ error: 'A phone number is required' });
  if (!isValidAlgerianPhone(phone)) {
    return res.status(400).json({
      error: "That doesn't look like a valid Algerian number — it should be 9 digits (e.g. 0555 12 34 56).",
    });
  }

  const code = generateOtpCode();
  setOtp(phone, code, channel);

  console.log('\n' + '─'.repeat(48));
  console.log(`  OTP for ${phone}  (asked via ${channel})`);
  console.log(`      →  ${code}`);
  console.log('─'.repeat(48) + '\n');

  res.json({ ok: true });
});

app.post('/auth/otp/verify', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!checkOtp(phone, req.body.code)) {
    return res.status(400).json({ error: 'That code is wrong or has expired' });
  }
  res.json({ verificationToken: createSignupToken(phone) });
});

app.post('/auth/register', (req, res) => {
  const payload = verifySignupToken(req.body.verificationToken);
  if (!payload) {
    return res.status(401).json({ error: 'Verify your phone number first' });
  }
  if (findByPhone(payload.phone)) {
    return res.status(409).json({ error: 'An account with this phone number already exists' });
  }
  console.log('POST /auth/register', {
    phone: payload.phone,
    accountType: req.body.accountType,
    photo: req.body.photo ? '<photo>' : null,
  });
  try {
    const validated = validateSignup(req.body);
    const user = addUser(buildUserRecord(validated, payload.phone));
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message });
  }
});

app.post('/auth/login', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const user = findByPhone(phone);
  // Split the errors so "even though it's correct" is diagnosable: the
  // number isn't valid, or there's no such account, or the password is off.
  if (!user) {
    return res.status(401).json({
      error: isValidAlgerianPhone(phone)
        ? 'No account found for that phone number — sign up to create one.'
        : "That doesn't look like a valid phone number.",
    });
  }
  if (!verifyPassword(req.body.password, user.passwordHash)) {
    return res.status(401).json({ error: 'Wrong password for that account.' });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
});

app.get('/auth/me', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ user: publicUser(user) });
});

// "Forgot password?" from the login screen. Proves phone ownership with the
// same OTP endpoints sign-up uses (no session exists yet to authenticate
// with, unlike /me/password), then sets a new password and signs the user
// straight in, the same as a fresh login would.
app.post('/auth/password/reset', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const payload = verifySignupToken(req.body.verificationToken);
  if (!payload || payload.phone !== phone) {
    return res.status(401).json({ error: 'Verify your phone number first' });
  }
  const user = findByPhone(phone);
  if (!user) {
    return res.status(404).json({ error: 'No account found for that phone number' });
  }
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  user.passwordHash = hashPassword(password);
  persist();
  res.json({ token: createToken(user), user: publicUser(user) });
});

// Account settings, the seller Profile tab.

// Editable profile fields. Phone and password are deliberately not here;
// each has its own OTP-guarded flow below so they stay verified.
app.patch('/me', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  if (typeof req.body.fullName === 'string') {
    const fullName = req.body.fullName.trim();
    if (!fullName) return res.status(400).json({ error: 'Your name cannot be empty' });
    user.fullName = fullName;
  }
  if (user.sellerType === 'agency' && typeof req.body.agencyName === 'string') {
    const agencyName = req.body.agencyName.trim();
    if (!agencyName) return res.status(400).json({ error: 'Agency name cannot be empty' });
    user.agencyName = agencyName;
  }
  if (typeof req.body.photo === 'string') {
    user.photo = req.body.photo || null;
  }

  persist();
  res.json({ user: publicUser(user) });
});

// Swap the account's phone number. verificationToken is proof that the OTP on
// the new number was passed, using the same /auth/otp/request and
// /auth/otp/verify endpoints the sign-up flow uses, no second OTP system.
app.post('/me/phone', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const newPhone = normalizePhone(req.body.newPhone);
  const payload = verifySignupToken(req.body.verificationToken);
  if (!payload || payload.phone !== newPhone) {
    return res.status(401).json({ error: 'Verify the new number first' });
  }
  if (!isValidAlgerianPhone(newPhone)) {
    return res.status(400).json({ error: "That doesn't look like a valid Algerian number." });
  }
  const clash = findByPhone(newPhone);
  if (clash && clash.id !== user.id) {
    return res.status(409).json({ error: 'That number is already registered to another account.' });
  }

  const oldPhone = user.phone;
  if (newPhone !== oldPhone) {
    user.phone = newPhone;
    // Ownership is keyed by phone across the app, so move it with the account.
    reassignOwner(oldPhone, newPhone);
    reassignInterestOwner(oldPhone, newPhone);
    persist();
  }
  res.json({ user: publicUser(user) });
});

// Set a new password after an OTP on the account's current number. The OTP
// is the identity check; there's no "current password" field.
app.post('/me/password', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const payload = verifySignupToken(req.body.verificationToken);
  if (!payload || payload.phone !== user.phone) {
    return res.status(401).json({ error: 'Verify your identity first' });
  }
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  user.passwordHash = hashPassword(password);
  persist();
  res.json({ ok: true });
});

// Visual-only "link Google", same as the sign-up ConnectGoogle stub, no real
// OAuth. It just records that the badge should show as connected.
app.post('/me/google', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  user.googleConnected = true;
  persist();
  res.json({ user: publicUser(user) });
});

// "Remove my account", a real delete: the account row plus its listings and
// interest records. The client confirms first and then signs the user out.
app.delete('/me', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  deleteAccount(user);
  res.json({ ok: true });
});

// Public profiles.

// A listing still shows for 30 days after posting (see relativeTime.js on
// the client), mirrored here so a public profile never advertises an
// expired listing.
const LISTING_LIFESPAN_DAYS = 30;
function isListingActive(property) {
  const created = new Date(property.createdAt).getTime();
  if (Number.isNaN(created)) return true;
  return created + LISTING_LIFESPAN_DAYS * 24 * 60 * 60 * 1000 > Date.now();
}

// The "who is this" tap-through from Property Detail's agency row or a name
// in Interested buyers. Public and no-auth by design: browsing never requires
// an account, so looking someone up shouldn't either. Returns only a safe
// subset that's already shown in pieces elsewhere (display name, photo,
// account type, and for sellers their still-active listings), never the
// password hash and never a phone number.
app.get('/accounts/public/:phone', (req, res) => {
  const phone = normalizePhone(req.params.phone);
  const user = findByPhone(phone);
  if (!user) return res.status(404).json({ error: 'No account found for that number' });

  const isSeller = user.role === 'seller';
  res.json({
    role: user.role,
    sellerType: user.sellerType,
    displayName: user.agencyName || user.fullName || 'Kniss Go user',
    fullName: user.fullName,
    agencyName: user.agencyName,
    photo: user.photo,
    listings: isSeller
      ? PROPERTIES.filter((p) => p.ownerId === user.phone && isListingActive(p))
      : [],
  });
});

// Account-synced favourites.

app.get('/me/favorites', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json({ favorites: user.favorites || [] });
});

app.put('/me/favorites', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  user.favorites = Array.isArray(req.body.favorites) ? req.body.favorites : [];
  persist();
  res.json({ favorites: user.favorites });
});

// Seller dashboard.

// Only the logged-in seller's own listings, matched by ownerId (= phone).
app.get('/me/properties', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  const mine = PROPERTIES.filter((property) => property.ownerId === user.phone).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ properties: mine });
});

// The people who've favourited this seller's listings, newest first, with
// enough of the property attached to show a row.
app.get('/me/leads', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  const leads = interestsForOwner(user.phone).map((entry) => {
    const property = PROPERTIES.find((p) => p.id === entry.propertyId);
    return {
      propertyId: entry.propertyId,
      propertyTitle: property ? property.title : 'a listing',
      propertyType: property ? property.type : null,
      buyerPhone: entry.buyerPhone,
      buyerName: entry.buyerName || null,
      createdAt: entry.createdAt,
    };
  });
  res.json({ leads });
});

// Properties.

// Records a buyer's interest in a listing for the owner to see. No auth on
// this endpoint itself: the client sends the buyer's phone and name in the
// body, and only does so for a signed-in buyer account (favouriting requires
// one now). name can be absent if the account has no display name.
app.post('/properties/:id/interest', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'A phone number is required' });
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

  const property = PROPERTIES.find((p) => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: 'No such listing' });

  recordInterest(property, phone, name || undefined);
  res.json({ ok: true });
});

app.post('/properties', (req, res) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Sign in to post a listing' });
  if (user.role !== 'seller') {
    return res.status(403).json({ error: 'Only seller accounts can post listings' });
  }
  console.log('POST /properties by', user.id, {
    ...req.body,
    photoUri: req.body.photoUri ? '<photo>' : null,
    photos: Array.isArray(req.body.photos) ? `<${req.body.photos.length} photos>` : undefined,
  });
  try {
    const newProperty = buildNewProperty(req.body, user);
    addProperty(newProperty);
    res.status(201).json({ property: newProperty });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/properties/nearby', (req, res) => {
  console.log(
    `GET /properties/nearby?lat=${req.query.lat}&lon=${req.query.lon}&radius=${req.query.radius}`
  );

  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  const radius = parseFloat(req.query.radius) || 200;

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon query parameters are required' });
  }

  const nearby = PROPERTIES.map((property) => ({
    ...property,
    distance: Math.round(distanceInMeters(lat, lon, property.latitude, property.longitude)),
  }))
    .filter((property) => property.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  res.json({ count: nearby.length, properties: nearby });
});

// Turn body-parser's oversized-body error into a clean JSON 413 the client
// can show, instead of the default HTML error page ("Server responded with 413").
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'Those photos are too large to upload. Try adding fewer, or smaller, images.',
    });
  }
  next(err);
});

// Belt-and-suspenders: flush to disk on Ctrl+C too, not only on each write.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    persist();
    process.exit(0);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kniss Go mock API listening on http://localhost:${PORT}`);
});
