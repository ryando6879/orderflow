const store = require("./store");

// Emptying the store. Tests call this between cases, and `npm run reset`
// clears a local dev box without restarting the process. It lives next to
// seed.js so the two halves of "set the data up / tear it down" are in the
// same place.

/** Drop every row in every table. */
function resetStore() {
  store.truncateAll();
  return store.TABLE_NAMES.length;
}

module.exports = { resetStore };

if (require.main === module) {
  console.log("cleared tables:", resetStore());
}
