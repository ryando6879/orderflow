const cartRepo = require("../repositories/cartRepo");
const orderRepo = require("../repositories/orderRepo");
const customerRepo = require("../repositories/customerRepo");
const { priceCart } = require("./pricingService");
const inventoryService = require("./inventoryService");
const fraudScoring = require("./fraudScoring");
const orderService = require("./orderService");
const { createCharge } = require("../integrations/paymentsClient");
const { once } = require("../lib/idempotency");
const { orderNumber, opaqueId } = require("../lib/ids");
const { isEnabled } = require("../config/featureFlags");
const { logger } = require("../lib/logger");

// Checkout. The order of operations matters and is deliberate:
//   price -> screen for fraud -> reserve stock -> charge -> create order
// Stock is reserved before the charge so we never take money for
// something we cannot ship; the charge is last so a fraud decline costs
// the provider nothing.

/** Risk signals we can derive from the order itself. */
function signalsFor(customer, priced, request) {
  const signals = [];
  const isFirstOrder = orderRepo.byCustomer(customer.id).length === 0;
  if (isFirstOrder && priced.total >= 20000) signals.push("first_order_high_value");
  if (isFirstOrder && request.service !== "standard") signals.push("rush_shipping_on_first_order");
  if (request.billingCountry && request.shippingCountry && request.billingCountry !== request.shippingCountry) {
    signals.push("mismatched_billing_country");
  }
  if (!isFirstOrder) signals.push("repeat_customer_in_good_standing");
  if (customer.createdAt && customer.createdAt < "2025-07-01") signals.push("account_older_than_year");
  const previous = orderRepo.byCustomer(customer.id);
  if (previous.some((order) => order.shipping?.address?.zip === request.address?.zip)) {
    signals.push("address_matches_previous_order");
  }
  return signals;
}

/**
 * Place an order from a cart.
 *
 * @param {{cartId: string, customerId: string, paymentMethodId: string,
 *          service?: string, address?: object, idempotencyKey?: string,
 *          billingCountry?: string, shippingCountry?: string}} request
 * @returns {Promise<{order: object, replayed: boolean}>}
 */
async function placeOrder(request) {
  const { replayed, result } = await once(
    {
      customerId: request.customerId,
      endpoint: "POST /v1/checkout",
      body: request,
      idempotencyKey: request.idempotencyKey,
    },
    () => runCheckout(request)
  );
  return { order: result, replayed };
}

async function runCheckout(request) {
  const cart = cartRepo.byId(request.cartId);
  if (!cart) {
    const err = new Error(`cart ${request.cartId} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  const customer = customerRepo.requireById(request.customerId);
  const service = request.service || "standard";
  const priced = priceCart({ items: cart.items, region: cart.region }, customer);

  const screening = fraudScoring.decide(signalsFor(customer, priced, request));
  if (screening.decision === "block") {
    const err = new Error("order declined by fraud screening");
    err.code = "declined";
    err.statusCode = 402;
    err.screening = screening;
    throw err;
  }
  const heldForReview = screening.decision === "review" && isEnabled("fraudManualReview");

  const claims = inventoryService.reserveCart(cart.items);

  const order = orderRepo.create({
    id: opaqueId("ord"),
    number: orderNumber(),
    customerId: customer.id,
    status: "pending",
    region: cart.region,
    service,
    lines: priced.lines.map((line, index) => ({
      sku: line.sku,
      qty: line.qty,
      unitPrice: Math.round(line.subtotal / line.qty),
      warehouseId: claims[index]?.warehouseId,
    })),
    amounts: {
      merchandise: priced.merchandise,
      discount: priced.discount,
      tax: priced.tax,
      shipping: priced.shipping,
      total: priced.total,
    },
    shipping: request.address ? { address: request.address } : undefined,
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    refundedTotal: 0,
    reviewHold: heldForReview,
    riskScore: screening.score,
  });

  if (heldForReview) {
    logger.warn("order held for manual review", { orderId: order.id, score: screening.score });
    cartRepo.markConverted(cart.id, order.id);
    return order;
  }

  const charge = await createCharge({
    amountCents: priced.total,
    customerId: customer.id,
    paymentMethodId: request.paymentMethodId,
    idempotencyKey: order.id,
    description: `OrderFlow ${order.number}`,
  });

  orderRepo.update(order.id, { chargeId: charge.id });
  cartRepo.markConverted(cart.id, order.id);
  customerRepo.addLifetimeSpend(customer.id, priced.total);
  await orderService.markPaid(order.id);
  return orderRepo.byId(order.id);
}

module.exports = { placeOrder, signalsFor };
