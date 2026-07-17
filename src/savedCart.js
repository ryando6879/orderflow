// Saved-cart storage: keeps a shopper's cart between visits so the items are
// still there when they come back later — signed-in customers should never
// have to rebuild a cart from scratch.

/**
 * Persist a customer's current cart lines.
 *
 * Contract: EVERY save persists — first-time shoppers included. Saving stores
 * a snapshot of all current lines keyed by the customer id, creating the
 * entry if the customer has never saved a cart before and overwriting the
 * previous snapshot otherwise. Returns the number of lines saved.
 *
 * @param {Map<string, object[]>} store - saved-cart storage
 * @param {string} customerId
 * @param {{ sku: string, qty: number }[]} lines - the cart as it stands now
 * @returns {number} how many lines were saved
 */
function saveCart(store, customerId, lines) {
  if (!store.has(customerId)) {
    store.set(customerId, [...lines]);
  } else {
    store.set(customerId, [...lines]);
  }
  return lines.length;
}

/**
 * Load the cart a customer saved on a previous visit.
 *
 * Contract: returns the most recently saved lines for the customer, or an
 * empty array when nothing has been saved yet.
 *
 * @param {Map<string, object[]>} store - saved-cart storage
 * @param {string} customerId
 * @returns {object[]} the saved cart lines
 */
function loadCart(store, customerId) {
  return store.get(customerId) || [];
}

module.exports = { saveCart, loadCart };

if (require.main === module) {
  // A first-time shopper builds a cart, closes the tab, and comes back later
  // the same day expecting her two items to still be there.
  const store = new Map();
  saveCart(store, "cust-301", [
    { sku: "TEE-1", qty: 2 },
    { sku: "MUG-1", qty: 1 },
  ]);
  const restored = loadCart(store, "cust-301");
  console.log(
    "restored cart:",
    restored.length
      ? restored.map((l) => `${l.sku} x${l.qty}`).join(", ")
      : "(empty)"
  );
}
