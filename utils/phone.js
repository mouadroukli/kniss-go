// Client-side mirror of server/auth.js's normalizePhone and
// isValidAlgerianPhone. Kept in sync by hand since the server and client are
// separate runtimes and can't share a module, so change one and change the
// other. Every way of typing an Algerian number canonicalises to "+213" plus
// 9 digits.

export function normalizePhone(raw) {
  if (typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = `213${digits.slice(1)}`;
  if (!digits.startsWith('213')) digits = `213${digits}`;
  return `+${digits}`;
}

export function isValidAlgerianPhone(raw) {
  return /^\+213\d{9}$/.test(normalizePhone(raw));
}
