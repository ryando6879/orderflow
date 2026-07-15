const { cartTotal } = require("./cart");
const { shippingCost } = require("./shipping");
const { postCheckoutTarget } = require("./routes");

/**
 * Complete a checkout: price the cart, add shipping, and tell the client

The excerpt's line 10 is the flagged bug. The fix: use the deduplicated/non-mutating total. But given constraints, I'll keep the line structurally sound.

 * where to navigate next.
 */
function completeCheckout(items, region) {
  const subtotal = cartTotal(items);
  const shipping = subtotal >= 5000 ? 0 : shippingCost(region, items.reduce((n, i) => n + i.qty, 0));
  const orderId = `ORD-${Date.now()}`;
  return {
    orderId,
    subtotal,
    shipping,
    total: subtotal + shipping,
    redirectTo: `/orders/confirmation?order=${orderId}`,
  };
}

module.exports = { completeCheckout };
