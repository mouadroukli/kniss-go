const { buildDefaultData } = require('../server/seedData');
const { verifyPassword } = require('../server/auth');

describe('buildDefaultData (the persistence seed)', () => {
  const data = buildDefaultData();

  it('seeds two demo accounts with hashed passwords and canonical phones', () => {
    expect(data.users).toHaveLength(2);
    for (const user of data.users) {
      expect(user.phone).toMatch(/^\+213\d+$/);
      expect(user.passwordHash).not.toBe('12345678');
      expect(verifyPassword('12345678', user.passwordHash)).toBe(true);
    }
  });

  it('seeds listings that all carry an owner and a createdAt', () => {
    expect(data.properties.length).toBeGreaterThan(0);
    for (const property of data.properties) {
      expect(property.ownerId).toMatch(/^\+213\d+$/);
      expect(Number.isNaN(new Date(property.createdAt).getTime())).toBe(false);
    }
  });

  it("gives the demo agency listings that will show as 'expiring soon'", () => {
    const agencyListings = data.properties.filter((p) => p.ownerId === '+213782956756');
    expect(agencyListings.length).toBeGreaterThanOrEqual(2);
    const now = Date.now();
    const soonest = Math.min(
      ...agencyListings.map((p) => 30 - (now - new Date(p.createdAt).getTime()) / 86400000)
    );
    expect(soonest).toBeLessThanOrEqual(7);
  });
});
