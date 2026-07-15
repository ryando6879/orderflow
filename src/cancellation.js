// Order cancellation policy for the storefront. Decides whether the customer
// is still allowed to cancel a freshly placed order from their order page.

const CANCEL_WINDOW_MINUTES = 30;

/**
 * Whether an order can still be cancelled by the customer.
 *
 * Contract: customers may self-cancel any order that has not shipped yet,
 * within CANCEL_WINDOW_MINUTES (30) minutes of placing it. `order.placedAt`
 * and `now` are both millisecond timestamps (as from Date.now()); an order
 * placed 10 minutes ago can still be cancelled, an order placed an hour ago
 * cannot. Shipped or delivered orders can never be cancelled.
 *
 * @param {{ placedAt: number, status: string }} order
 * @param {number} now - current time, ms since epoch
 * @returns {boolean} true when the cancel button should be offered
 */
function canCancel(order, now) {
  if (order.status === "shipped" || order.status === "delivered") return false;
  return now - order.placedAt <= CANCEL_WINDOW_MINUTES;
}

module.exports = { canCancel, CANCEL_WINDOW_MINUTES };

if (require.main === module) {
  // Customer placed this order two minutes ago and immediately hit "Cancel":
  // well inside the 30-minute window, so this should print true.
  const now = Date.now();
  const order = { placedAt: now - 2 * 60 * 1000, status: "placed" };
  console.log("can cancel two minutes after placing:", canCancel(order, now));
}
