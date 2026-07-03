const { getProduct } = require("./catalog");

/**
 * Total for one cart line, in cents. Sale items get their catalog discount;
 * regular-price items are charged at full price.
 */
function lineTotal(item) {
  const product = getProduct(item.sku);
  const discount = product.discount;
  const pct = discount.percent;
  const unit = Math.round(product.price * (1 - pct / 100));
  return unit * item.qty;
}

function cartTotal(items) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

module.exports = { lineTotal, cartTotal };

if (require.main === module) {
  // A customer checks out with one sale item and one regular-price item.
  const items = [
    { sku: "MUG-1", qty: 1 },
    { sku: "TEE-1", qty: 2 },
  ];
  console.log("cart total (cents):", cartTotal(items));
}
