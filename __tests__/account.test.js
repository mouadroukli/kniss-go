const { addUser, findById } = require('../server/users');
const { PROPERTIES, addProperty, reassignOwner, removeByOwner } = require('../server/properties');
const { interests, recordInterest } = require('../server/interestStore');
const { deleteAccount } = require('../server/account');
const {
  validateSignup,
  buildUserRecord,
  hashPassword,
  verifyPassword,
} = require('../server/auth');

const stubListing = (id, ownerId) => ({
  id,
  title: `Listing ${id}`,
  type: 'Villa',
  listingType: 'Sell',
  price: 1,
  latitude: 1,
  longitude: 1,
  createdAt: new Date().toISOString(),
  features: [],
  nearby: {},
  photos: [],
  ownerId,
  phoneNumber: ownerId,
});

describe('hashPassword', () => {
  it('produces a hash that verifyPassword accepts (and only for the right password)', () => {
    const hash = hashPassword('secretpw123');
    expect(hash).not.toBe('secretpw123');
    expect(verifyPassword('secretpw123', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('reassignOwner', () => {
  it('moves a phone number’s listings (ownerId + phoneNumber) to the new number', () => {
    addProperty(stubListing('acct-test-1', '+213590002233'));

    reassignOwner('+213590002233', '+213590003344');

    const moved = PROPERTIES.find((p) => p.id === 'acct-test-1');
    expect(moved.ownerId).toBe('+213590003344');
    expect(moved.phoneNumber).toBe('+213590003344');

    removeByOwner('+213590003344'); // cleanup
  });
});

describe('deleteAccount', () => {
  it('removes the account row, its listings and its interest records', () => {
    const phone = '+213590001122';
    const user = addUser(
      buildUserRecord(
        validateSignup({
          accountType: 'individual',
          fullName: 'Temp Seller',
          password: 'password1',
          acceptedTerms: true,
        }),
        phone
      )
    );
    addProperty(stubListing('acct-test-2', phone));
    recordInterest({ id: 'acct-test-2', ownerId: phone }, '+213770009999');

    expect(findById(user.id)).toBeTruthy();
    expect(PROPERTIES.some((p) => p.id === 'acct-test-2')).toBe(true);
    expect(interests.some((i) => i.ownerId === phone)).toBe(true);

    const done = deleteAccount(user);

    expect(done).toBe(true);
    expect(findById(user.id)).toBeUndefined();
    expect(PROPERTIES.some((p) => p.id === 'acct-test-2')).toBe(false);
    expect(interests.some((i) => i.ownerId === phone)).toBe(false);
  });

  it('is a no-op for an account that is already gone', () => {
    expect(deleteAccount({ id: 'nope', phone: '+213500000000' })).toBe(false);
  });
});
