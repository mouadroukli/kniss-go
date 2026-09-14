// In-memory OTP store, keyed by normalized phone. Same "resets when the
// server restarts" limitation as everything else here. One code per phone at
// a time; a new request overwrites the old.
const codes = new Map();
const TTL_MS = 5 * 60 * 1000;

function setOtp(phone, code, channel) {
  codes.set(phone, { code, channel, expiresAt: Date.now() + TTL_MS });
}

function checkOtp(phone, code) {
  const entry = codes.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    codes.delete(phone);
    return false;
  }
  if (entry.code !== String(code || '').trim()) return false;
  codes.delete(phone); // single use
  return true;
}

module.exports = { setOtp, checkOtp };
