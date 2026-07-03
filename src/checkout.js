const { cartTotal } = require("./cart");
const { shippingCost } = require("./shipping");
const { postCheckoutTarget } = require("./routes");

/**
 * Complete a checkout: price the cart, add shipping, and tell the client
 * where to navigate next.
 */
function completeCheckout(items, region) {
  const subtotal = cartTotal(items);
  const shipping = shippingCost(region, items.reduce((n, i) => n + i.qty, 0));
  const orderId = `ORD-${Date.now()}`;
  return {
    orderId,
    subtotal,
    shipping,
    total: subtotal + shipping,
      redirectTo: `/order-confirmation/${orderId}`,
  };
}

module.exports = { completeCheckout };
