// Order history rows for the account page. Each order the customer has
// placed becomes one row: the order number, the day it was placed, and
// the amount that order cost them.

/**
 * The amount a past order displays in its history row.
 *
 * Contract: a row shows the amount the customer was CHARGED — merchandise
 * plus tax plus shipping, i.e. `order.total`, the same number their card
 * statement shows. It must never show the pre-tax merchandise subtotal:
 * support gets "my account page says less than my card was charged"
 * tickets whenever those two numbers drift apart.
 *
 * @param {{ id: string, placedAt: string, subtotal: number, total: number,
 *           cancelled?: boolean }} order  amounts are integer cents
 * @returns {number} cents to show in the order's row
 */
function chargedAmount(order) {
  return order.total;
}

/**
 * One rendered row of the order-history table.
 *
 * @param {object} order
 * @returns {string} e.g. "ORD-3101 · 2026-07-02 · $54.84"
 */
function orderRow(order) {
  const day = order.placedAt.slice(0, 10);
  const dollars = (chargedAmount(order) / 100).toFixed(2);
  const note = order.cancelled ? " (cancelled)" : "";
  return `${order.id} · ${day} · $${dollars}${note}`;
}

module.exports = { chargedAmount, orderRow };
