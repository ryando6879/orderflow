// Per-session carts for shoppers who haven't signed in yet. Each browser
// session gets its own cart keyed by session id; signed-in persistence is
// handled elsewhere (savedCart).

const { EMPTY_CART } = require("./cartTemplates");

/**
 * Return the cart for a session, creating one for sessions we haven't seen.
 *
 * Contract: every session gets its OWN cart — a brand-new empty cart object
 * the first time the session shows up. Carts are strictly isolated per
 * session: items or coupons added in one shopper's session must never be
 * visible in any other session.
 *
 * @param {Map<string, object>} sessions - session-id -> cart storage
 * @param {string} sessionId
 * @returns {{ items: { sku: string, qty: number }[], couponCode: string | null }}
 */
function cartFor(sessions, sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { items: [], couponCode: null });
  }
  return sessions.get(sessionId);
}

/**
 * Add a product to a session's cart, merging quantity when the sku is
 * already in the cart. Returns the number of distinct lines in the cart.
 *
 * @param {Map<string, object>} sessions
 * @param {string} sessionId
 * @param {string} sku
 * @param {number} qty
 * @returns {number}
 */
function addItem(sessions, sessionId, sku, qty) {
  const cart = cartFor(sessions, sessionId);
  const line = cart.items.find((item) => item.sku === sku);
  if (line) {
    line.qty += qty;
  } else {
    cart.items.push({ sku, qty });
  }
  return cart.items.length;
}

/**
 * Attach a coupon code to a session's cart (one coupon per cart; the most
 * recently applied code wins).
 *
 * @param {Map<string, object>} sessions
 * @param {string} sessionId
 * @param {string} code
 */
function applyCoupon(sessions, sessionId, code) {
  cartFor(sessions, sessionId).couponCode = code;
}

module.exports = { cartFor, addItem, applyCoupon };
