// Mini-cart widget: the little cart summary in the page header. Pure
// renderer — it just formats whatever cartSession hands it for the session.

const { cartFor } = require("./cartSession");

/**
 * Render the header mini-cart line for a session.
 *
 * Contract: shows the session's own cart lines as "SKU xQTY" separated by
 * commas, or "Your cart is empty" when the session has nothing in its cart.
 *
 * @param {Map<string, object>} sessions
 * @param {string} sessionId
 * @returns {string}
 */
function miniCartLabel(sessions, sessionId) {
  const cart = cartFor(sessions, sessionId);
  if (cart.items.length === 0) {
    return "Your cart is empty";
  }
  const lines = cart.items.map((item) => `${item.sku} x${item.qty}`).join(", ");
  return `Your cart: ${lines}`;
}

module.exports = { miniCartLabel };

if (require.main === module) {
  // Two shoppers browse the store at the same time in separate sessions.
  // The second shopper has just arrived and hasn't added anything yet.
  const { addItem } = require("./cartSession");
  const sessions = new Map();

  addItem(sessions, "sess-1042", "TEE-1", 2);
  addItem(sessions, "sess-1042", "MUG-1", 1);

  console.log("shopper A —", miniCartLabel(sessions, "sess-1042"));
  console.log("shopper B (brand new) —", miniCartLabel(sessions, "sess-2077"));
}
