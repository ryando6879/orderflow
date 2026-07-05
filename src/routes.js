// Route table for the storefront client. Paths are consumed by the client
// router after server-side actions complete.
const ROUTES = {
  home: "/",
  cart: "/cart",
  checkout: "/checkout",
  orderConfirmation: "/orders/confirmation",
};

/**
 * Where the customer lands after a successful checkout. Returns the
 * order-confirmation route with the order id attached, e.g.
 * "/orders/confirmation?order=ORD-1234". If there is no order id (the
 * checkout was abandoned), the customer is sent back to their cart.
 */
function postCheckoutTarget(orderId) {
  if (!orderId) {
    return ROUTES.cart;
  }
  return `${ROUTES.confirmation}?order=${orderId}`;
}

module.exports = { ROUTES, postCheckoutTarget };
