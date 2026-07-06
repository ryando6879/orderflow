// Shipping rate card, in cents. Orders from regions without a dedicated
// rate ship at the rest-of-world ("row") rate.
const RATES = {
  us: { base: 500, perItem: 100 },
  eu: { base: 900, perItem: 150 },
  row: { base: 1400, perItem: 250 },
};

/**
 * Shipping cost in cents for an order. Region codes are case-insensitive;
 * regions without a dedicated rate fall back to the rest-of-world rate.
 */
function shippingCost(region, itemCount) {
  const rate = RATES[region.toLowerCase()] || RATES.row;
  return rate.base + rate.perItem * itemCount;
}

module.exports = { shippingCost };

if (require.main === module) {
  // An order shipping to a region without a dedicated rate.
  console.log("shipping to APAC, 3 items (cents):", shippingCost("apac", 3));
}
