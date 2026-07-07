const { memberTier } = require("./loyalty");
const { bestPromotion, promotionDiscount } = require("./promotions");

/**
 * Build the final invoice for a priced order.
 *
 * Discount stack (shipping is always charged in full):
 *   1. the member's loyalty discount, applied to the merchandise subtotal
 *   2. the best order promotion — its eligibility threshold and its
 *      percentage are both evaluated against the merchandise subtotal
 *      BEFORE the member discount (the advertised cart value)
 *
 * @param {{subtotal: number, shipping: number}} pricing  order pricing in cents
 * @param {{lifetimeSpend?: number}} member               the purchasing member
 * @returns {{tier: string, discount: number, promo: string | null,
 *            promoDiscount: number, total: number}} invoice in cents
 */
function buildInvoice(pricing, member) {
  const tier = memberTier(member);
  const discount = Math.round(pricing.subtotal * (tier.discountPct / 100));
  const discountedSubtotal = pricing.subtotal - discount;
  const promo = bestPromotion(pricing.subtotal);
  const promoDiscount = promotionDiscount(pricing.subtotal, promo);
  return {
    tier: tier.name,
    discount,
    promo: promo ? promo.code : null,
    promoDiscount,
    total: discountedSubtotal - promoDiscount + pricing.shipping,
  };
}

module.exports = { buildInvoice };

if (require.main === module) {
  // A gold member (lifetime spend $1,500) checks out a $34 order.
  const pricing = { subtotal: 3400, shipping: 700 };
  console.log("invoice:", buildInvoice(pricing, { lifetimeSpend: 150000 }));
}
