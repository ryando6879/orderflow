// Loyalty reward points earned on a completed order. Shown on the order
// confirmation screen and added to the customer's running points balance so
// they can redeem them against a future purchase.

const POINTS_PER_DOLLAR = 1;

/**
 * Reward points earned for a completed order.
 *
 * Contract: points are earned on the order's MERCHANDISE SUBTOTAL only — the
 * value of the items purchased, BEFORE shipping is added. Shipping fees never
 * earn points. The customer earns POINTS_PER_DOLLAR point per whole dollar of
 * subtotal, with any partial dollar rounded DOWN. A $50.00 order of items with
 * $8.00 shipping earns 50 points, not 58.
 *
 * @param {{ subtotal: number, shipping: number }} order - amounts in cents
 * @returns {number} whole reward points earned
 */
function rewardPointsForOrder(order) {
  const eligible = order.subtotal;
  return Math.floor(eligible / 100) * POINTS_PER_DOLLAR;
}

module.exports = { rewardPointsForOrder };

if (require.main === module) {
  // $50.00 of merchandise with $8.00 shipping: the customer should earn 50
  // points (subtotal only), not 58.
  const order = { subtotal: 5000, shipping: 800 };
  console.log("reward points earned:", rewardPointsForOrder(order));
}
