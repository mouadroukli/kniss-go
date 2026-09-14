import { normalizePhone, isValidAlgerianPhone } from '../utils/phone';

// The client mirror of the server's phone helpers, must agree with
// server/auth.js so sign-up and login always land on the same string.
describe('utils/phone', () => {
  it('canonicalises every format of one number to +213 + 9 digits', () => {
    const canonical = '+213798554433';
    expect(normalizePhone('+213 798 55 44 33')).toBe(canonical);
    expect(normalizePhone('00213798554433')).toBe(canonical);
    expect(normalizePhone('0798-55-44-33')).toBe(canonical);
    expect(normalizePhone('798554433')).toBe(canonical);
  });

  it('validates the canonical shape', () => {
    expect(isValidAlgerianPhone('0798554433')).toBe(true);
    expect(isValidAlgerianPhone('+213798554433')).toBe(true);
    expect(isValidAlgerianPhone('05448045')).toBe(false); // incomplete
    expect(isValidAlgerianPhone('')).toBe(false);
    expect(isValidAlgerianPhone(undefined)).toBe(false);
  });
});
