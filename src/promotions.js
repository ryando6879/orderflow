// Order-level promotions ("X% off orders over $Y"). The advertised
// threshold and percentage always refer to the merchandise subtotal
// (the cart value) BEFORE any loyalty/member discount is taken off.
const PROMOTIONS = [
  { code: "SAVE5", minSubtotal: 6000, percentOff: 5 },
  { code: "BULK10", minSubtotal: 12000, percentOff: 10 },
];

/**
 * The promotion that applies to an order: of all promotions whose
 * threshold the subtotal meets, the one with the highest percentage.
 *
 * @param {number} subtotal merchandise subtotal in cents (pre-member-discount)
 * @returns {{code: string, minSubtotal: number, percentOff: number} | null}
 */
function bestPromotion(subtotal) {
  return PROMOTIONS.findLast((p) => subtotal >= p.minSubtotal) || null;
}

/**
 * Discount in cents that a promotion takes off an order.
 *
 * @param {number} subtotal merchandise subtotal in cents (pre-member-discount)
 * @param {{percentOff: number} | null} promo
 * @returns {number} discount in cents (0 when no promotion applies)
 */
function promotionDiscount(subtotal, promo) {
  if (!promo) return 0;
  return Math.round(subtotal * (promo.percentOff / 100));
}

module.exports = { bestPromotion, promotionDiscount };

if (require.main === module) {
  // A $125 cart qualifies for the big-order promotion.
  console.log("promotion for a 12500-cent cart:", bestPromotion(12500));
}
