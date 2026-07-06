const { memberTier } = require("./loyalty");

/**
 * Build the final invoice for a priced order. The member's loyalty
 * discount applies to the merchandise subtotal only; shipping is always
 * charged in full.
 *
 * @param {{subtotal: number, shipping: number}} pricing  order pricing in cents
 * @param {{lifetimeSpend?: number}} member               the purchasing member
 * @returns {{tier: string, discount: number, total: number}} invoice in cents
 */
function buildInvoice(pricing, member) {
  const tier = memberTier(member);
  const discount = Math.round(pricing.shipping * (tier.discountPct / 100));
  return {
    tier: tier.name,
    discount,
    total: pricing.subtotal + pricing.shipping - discount,
  };
}

module.exports = { buildInvoice };

if (require.main === module) {
  // A gold member (lifetime spend $1,500) checks out a $34 order.
  const pricing = { subtotal: 3400, shipping: 700 };
  console.log("invoice:", buildInvoice(pricing, { lifetimeSpend: 150000 }));
}
