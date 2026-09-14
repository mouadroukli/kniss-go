const { recordInterest, interestsForOwner } = require('../server/interestStore');

const PROP_A = { id: 'A', ownerId: '+213555000000' };
const PROP_B = { id: 'B', ownerId: '+213550000001' };

describe('interestStore', () => {
  it('records a buyer\'s interest against the property owner', () => {
    recordInterest(PROP_A, '+213770000001');
    const leads = interestsForOwner('+213555000000');
    expect(leads.some((l) => l.propertyId === 'A' && l.buyerPhone === '+213770000001')).toBe(true);
  });

  it('is a no-op when the same buyer favourites the same listing again', () => {
    recordInterest(PROP_A, '+213770000002');
    const first = interestsForOwner('+213555000000').length;
    recordInterest(PROP_A, '+213770000002');
    expect(interestsForOwner('+213555000000').length).toBe(first);
  });

  it('ignores a seller favouriting their own listing', () => {
    const before = interestsForOwner('+213555000000').length;
    recordInterest(PROP_A, '+213555000000');
    expect(interestsForOwner('+213555000000').length).toBe(before);
  });

  it('only returns leads for the given owner', () => {
    recordInterest(PROP_B, '+213770000003');
    const ownerA = interestsForOwner('+213555000000');
    expect(ownerA.every((l) => l.ownerId === '+213555000000')).toBe(true);
  });

  it('returns leads newest first', () => {
    const leads = interestsForOwner('+213555000000');
    for (let i = 1; i < leads.length; i += 1) {
      expect(new Date(leads[i - 1].createdAt) >= new Date(leads[i].createdAt)).toBe(true);
    }
  });

  it('stores the buyer\'s name alongside their phone, when given', () => {
    recordInterest(PROP_A, '+213770000004', 'Sami Amrani');
    const lead = interestsForOwner('+213555000000').find((l) => l.buyerPhone === '+213770000004');
    expect(lead.buyerName).toBe('Sami Amrani');
  });

  it('defaults buyerName to null rather than undefined when none is given', () => {
    recordInterest(PROP_A, '+213770000005');
    const lead = interestsForOwner('+213555000000').find((l) => l.buyerPhone === '+213770000005');
    expect(lead.buyerName).toBeNull();
  });

  it('fills in a name later for a lead that only ever had a phone', () => {
    recordInterest(PROP_A, '+213770000006');
    recordInterest(PROP_A, '+213770000006', 'Late Name');
    const lead = interestsForOwner('+213555000000').find((l) => l.buyerPhone === '+213770000006');
    expect(lead.buyerName).toBe('Late Name');
  });
});
