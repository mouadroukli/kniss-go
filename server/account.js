const { removeUser } = require('./users');
const { removeByOwner } = require('./properties');
const { removeForPhone } = require('./interestStore');

// "Remove my account", a real delete, not a sign-out. Pulls the account row
// and everything keyed to its phone number: the seller's own listings, and
// any interest records on either side.
function deleteAccount(user) {
  if (!user) return false;
  const existed = removeUser(user.id);
  if (!existed) return false;
  removeByOwner(user.phone);
  removeForPhone(user.phone);
  return true;
}

module.exports = { deleteAccount };
