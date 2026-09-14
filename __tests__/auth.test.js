const {
  normalizePhone,
  isValidAlgerianPhone,
  generateOtpCode,
  createSignupToken,
  verifySignupToken,
  validateSignup,
  buildUserRecord,
  verifyPassword,
  createToken,
  verifyToken,
  publicUser,
} = require('../server/auth');

describe('normalizePhone', () => {
  // The whole point: every way of typing one Algerian number canonicalises
  // to the same string, so sign-up and login always match.
  it('canonicalises every format of the same number to +213...', () => {
    const canonical = '+213798554433';
    expect(normalizePhone('+213 798 55 44 33')).toBe(canonical); // international, spaced
    expect(normalizePhone('00213798554433')).toBe(canonical); // 00 prefix
    expect(normalizePhone('0798-55-44-33')).toBe(canonical); // local, leading zero
    expect(normalizePhone('0798554433')).toBe(canonical); // local, no separators
    expect(normalizePhone('798554433')).toBe(canonical); // bare 9 digits
  });

  it('leaves an already-canonical number unchanged', () => {
    expect(normalizePhone('+213555000000')).toBe('+213555000000');
  });

  it('is empty for junk input', () => {
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(undefined)).toBe('');
    expect(normalizePhone('abc')).toBe('');
  });
});

describe('isValidAlgerianPhone', () => {
  it('accepts +213 followed by exactly 9 digits, any input format', () => {
    expect(isValidAlgerianPhone('+213555000000')).toBe(true);
    expect(isValidAlgerianPhone('0555 00 00 00')).toBe(true);
    expect(isValidAlgerianPhone('00213555000000')).toBe(true);
  });

  it('rejects a too-short / incomplete number (the bug: a mistyped signup)', () => {
    expect(isValidAlgerianPhone('05448045')).toBe(false); // -> +2135448045, 7 digits
    expect(isValidAlgerianPhone('0555')).toBe(false);
    expect(isValidAlgerianPhone('')).toBe(false);
    expect(isValidAlgerianPhone('+21355500000012345')).toBe(false); // too long
  });
});

describe('generateOtpCode', () => {
  it('is always six digits', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe('signup tokens', () => {
  it('round-trips a phone number through a scoped token', () => {
    const payload = verifySignupToken(createSignupToken('+213550112233'));
    expect(payload.phone).toBe('+213550112233');
    expect(payload.scope).toBe('signup');
  });

  it('rejects a bogus or tampered token', () => {
    expect(verifySignupToken('not.a.jwt')).toBeNull();
    expect(verifySignupToken(`${createSignupToken('1')}x`)).toBeNull();
  });

  it('rejects a session token used where a signup token is expected', () => {
    const sessionToken = createToken({ id: 'u_1', role: 'seller' });
    expect(verifySignupToken(sessionToken)).toBeNull();
  });
});

describe('validateSignup', () => {
  const individual = {
    accountType: 'individual',
    password: 'password1',
    fullName: 'Sami Test',
    monthlyListings: '3',
    acceptedTerms: true,
  };

  it('accepts a complete individual payload and coerces the count', () => {
    const result = validateSignup(individual);
    expect(result.accountType).toBe('individual');
    expect(result.agencyName).toBeNull();
    expect(result.monthlyListings).toBe(3);
  });

  it('requires an agency name for agencies', () => {
    expect(() =>
      validateSignup({ ...individual, accountType: 'agency', agencyName: '' })
    ).toThrow(/Agency name is required/);
  });

  it('requires the terms to be accepted', () => {
    expect(() => validateSignup({ ...individual, acceptedTerms: false })).toThrow(
      /accept the terms/
    );
  });

  it('rejects a short password', () => {
    expect(() => validateSignup({ ...individual, password: 'short' })).toThrow(
      /at least 8 characters/
    );
  });

  it('throws an error carrying a 400 status', () => {
    try {
      validateSignup({});
      throw new Error('should have thrown');
    } catch (error) {
      expect(error.status).toBe(400);
    }
  });

  it('defaults a missing monthly count to 0 rather than NaN', () => {
    const result = validateSignup({ ...individual, monthlyListings: undefined });
    expect(result.monthlyListings).toBe(0);
  });

  it('accepts a buyer account with no agency name and no listing quota', () => {
    const result = validateSignup({
      accountType: 'buyer',
      password: 'password1',
      fullName: 'Amina Buyer',
      monthlyListings: '5', // a buyer sends none of this, but it must be ignored if it did
      acceptedTerms: true,
    });
    expect(result.accountType).toBe('buyer');
    expect(result.agencyName).toBeNull();
    expect(result.monthlyListings).toBe(0);
  });

  it('falls back to individual for an unrecognised account type', () => {
    expect(validateSignup({ ...individual, accountType: 'admin' }).accountType).toBe('individual');
  });
});

describe('password hashing', () => {
  it('round-trips a password through the hash', () => {
    const user = buildUserRecord(
      validateSignup({
        accountType: 'individual',
        password: 'password1',
        fullName: 'A',
        acceptedTerms: true,
      }),
      '+213550112233'
    );
    expect(user.passwordHash).not.toBe('password1');
    expect(verifyPassword('password1', user.passwordHash)).toBe(true);
    expect(verifyPassword('wrong', user.passwordHash)).toBe(false);
  });
});

describe('session tokens', () => {
  const user = { id: 'u_42', role: 'seller' };

  it('creates a token that verifies back to the user id', () => {
    const payload = verifyToken(createToken(user));
    expect(payload.sub).toBe('u_42');
  });

  it('returns null for a tampered token', () => {
    expect(verifyToken(`${createToken(user)}x`)).toBeNull();
  });
});

describe('publicUser', () => {
  it('never leaks the password hash and derives a display name', () => {
    const record = buildUserRecord(
      validateSignup({
        accountType: 'agency',
        agencyName: 'Kniss Realty',
        fullName: 'Zakaria',
        password: 'password1',
        acceptedTerms: true,
      }),
      '+213555000000'
    );
    const view = publicUser(record);
    expect(view.passwordHash).toBeUndefined();
    expect(view.displayName).toBe('Kniss Realty');
    expect(view.sellerType).toBe('agency');
  });

  it('gives a buyer account role "buyer", a null sellerType, and a name-based display name', () => {
    const record = buildUserRecord(
      validateSignup({
        accountType: 'buyer',
        fullName: 'Amina Buyer',
        password: 'password1',
        acceptedTerms: true,
      }),
      '+213561112233'
    );
    expect(record.role).toBe('buyer');
    expect(record.sellerType).toBeNull();

    const view = publicUser(record);
    expect(view.role).toBe('buyer');
    expect(view.displayName).toBe('Amina Buyer');
  });
});
