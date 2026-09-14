const { db, persist } = require('./db');

// The user store is now backed by db.js (data.json). Seed accounts and any
// created through sign-up live in the same list.
//
//   agency  +213782956756  /  12345678
//   buyer   +213777777777  /  12345678

function findByPhone(phone) {
  return db.users.find((user) => user.phone === phone);
}

function findById(id) {
  return db.users.find((user) => user.id === id);
}

function addUser(user) {
  db.users.push(user);
  persist();
  return user;
}

// Removes just the account row. Listings and interest records tied to the
// account are cleaned up by the caller (server/account.js) so this module
// doesn't have to know about the others.
function removeUser(id) {
  const index = db.users.findIndex((user) => user.id === id);
  if (index === -1) return false;
  db.users.splice(index, 1);
  persist();
  return true;
}

module.exports = {
  findByPhone,
  findById,
  addUser,
  removeUser,
};
