const { db, persist } = require('./db');

// Listings are backed by db.js (data.json). PROPERTIES is the live array;
// mutate it through addProperty() so the change gets persisted.
const PROPERTIES = db.properties;

function addProperty(property) {
  PROPERTIES.push(property);
  persist();
  return property;
}

// When a seller changes their phone number, their listings' ownership (keyed
// by phone across the whole app) has to move with it or "my listings" and
// the leads for those listings silently break.
function reassignOwner(oldPhone, newPhone) {
  let changed = false;
  for (const property of PROPERTIES) {
    if (property.ownerId === oldPhone) {
      property.ownerId = newPhone;
      property.phoneNumber = newPhone;
      changed = true;
    }
  }
  if (changed) persist();
  return changed;
}

// Drops every listing owned by a phone number, used when an account is deleted.
function removeByOwner(phone) {
  let removed = 0;
  for (let i = PROPERTIES.length - 1; i >= 0; i -= 1) {
    if (PROPERTIES[i].ownerId === phone) {
      PROPERTIES.splice(i, 1);
      removed += 1;
    }
  }
  if (removed) persist();
  return removed;
}

module.exports = { PROPERTIES, addProperty, reassignOwner, removeByOwner };
