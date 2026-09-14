const { db, persist } = require('./db');

// Interest records are backed by db.js (data.json), same as users and
// properties, so a lead survives a server restart instead of resetting to
// just the seed data every time. INTERESTS is the live array; mutate it in
// place (push/splice) rather than reassigning, so persist() and the exported
// reference stay in sync.
const INTERESTS = db.interests;

// Records interest, keyed by (property, buyer) so favouriting twice is a
// no-op. A seller favouriting their own listing isn't a lead. buyerName is
// optional, since an account might not have a display name set.
function recordInterest(property, buyerPhone, buyerName) {
  if (!property || !buyerPhone || buyerPhone === property.ownerId) return null;

  const existing = INTERESTS.find(
    (entry) => entry.propertyId === property.id && entry.buyerPhone === buyerPhone
  );
  if (existing) {
    // A name volunteered later (e.g. a returning buyer who only had a phone
    // on file before) fills in a gap rather than being dropped.
    if (buyerName && !existing.buyerName) {
      existing.buyerName = buyerName;
      persist();
    }
    return existing;
  }

  const entry = {
    propertyId: property.id,
    ownerId: property.ownerId,
    buyerPhone,
    buyerName: buyerName || null,
    createdAt: new Date().toISOString(),
  };
  INTERESTS.push(entry);
  persist();
  return entry;
}

function interestsForOwner(ownerId) {
  return INTERESTS.filter((entry) => entry.ownerId === ownerId).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Follows a phone-number change so the owner keeps seeing their leads.
function reassignOwner(oldOwnerId, newOwnerId) {
  let changed = false;
  for (const entry of INTERESTS) {
    if (entry.ownerId === oldOwnerId) {
      entry.ownerId = newOwnerId;
      changed = true;
    }
  }
  if (changed) persist();
}

// Clears out anything tied to a phone (either side) when an account is deleted.
function removeForPhone(phone) {
  let removed = false;
  for (let i = INTERESTS.length - 1; i >= 0; i -= 1) {
    if (INTERESTS[i].ownerId === phone || INTERESTS[i].buyerPhone === phone) {
      INTERESTS.splice(i, 1);
      removed = true;
    }
  }
  if (removed) persist();
}

module.exports = {
  interests: INTERESTS,
  recordInterest,
  interestsForOwner,
  reassignOwner,
  removeForPhone,
};
