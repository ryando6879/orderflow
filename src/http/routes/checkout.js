const checkoutService = require("../../services/checkoutService");
const { created, ok } = require("../respond");
const { requireScope } = require("../middleware/auth");
const { body } = require("../middleware/validate");

// Checkout. One endpoint, and it is idempotent: the storefront retries it
// on a timeout, and a retry must not place a second order.

function register(router) {
  // POST /v1/checkout
  router.post(
    "/v1/checkout",
    async (ctx) => {
      const { order, replayed } = await checkoutService.placeOrder({
        cartId: ctx.body.cartId,
        customerId: ctx.body.customerId,
        paymentMethodId: ctx.body.paymentMethodId,
        service: ctx.body.service,
        address: ctx.body.address,
        billingCountry: ctx.body.billingCountry,
        shippingCountry: ctx.body.shippingCountry,
        idempotencyKey: ctx.req.headers["idempotency-key"],
      });

      const payload = {
        orderId: order.id,
        number: order.number,
        status: order.status,
        total: order.amounts.total,
        reviewHold: Boolean(order.reviewHold),
        replayed,
      };
      return replayed ? ok(ctx.res, payload) : created(ctx.res, payload, `/v1/orders/${order.id}`);
    },
    [
      requireScope("checkout:write"),
      body({
        cartId: "string",
        customerId: "string",
        paymentMethodId: "string",
        service: "string?",
        address: "object?",
        billingCountry: "string?",
        shippingCountry: "string?",
      }),
    ]
  );

  // POST /v1/checkout/quote — price a cart without placing anything.
  router.post(
    "/v1/checkout/quote",
    (ctx) => {
      const { priceCart } = require("../../services/pricingService");
      const priced = priceCart({ items: ctx.body.items, region: ctx.body.region || "us" }, ctx.body.member || {});
      return ok(ctx.res, priced);
    },
    [requireScope("checkout:write"), body({ items: "array", region: "string?", member: "object?" })]
  );
}

module.exports = { register };
