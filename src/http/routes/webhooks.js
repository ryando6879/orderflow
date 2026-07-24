const { verifyWebhook, SIGNATURE_HEADER } = require("../../integrations/webhookSignature");
const webhookEventRepo = require("../../repositories/webhookEventRepo");
const orderRepo = require("../../repositories/orderRepo");
const orderService = require("../../services/orderService");
const store = require("../../db/store");
const { config } = require("../../config");
const { ok, fail } = require("../respond");

// Inbound provider webhooks. These endpoints are unauthenticated in the
// API-key sense — they authenticate with the provider's signature — and
// they are hit by scanners, so every code path here has to be safe
// against a hostile request.
//
// Both providers deliver at least once, so every handler runs through
// webhookEventRepo.applyOnce.

/** Apply a payments event. */
async function applyPaymentsEvent(event) {
  const order = event.data?.orderId ? orderRepo.byId(event.data.orderId) : undefined;
  switch (event.type) {
    case "charge.succeeded":
      if (order && order.status === "pending") await orderService.markPaid(order.id);
      return { handled: "charge.succeeded" };
    case "charge.failed":
      if (order) orderRepo.update(order.id, { lastPaymentError: event.data.failureCode });
      return { handled: "charge.failed" };
    case "charge.refunded":
      if (order) orderRepo.update(order.id, { refundedTotal: event.data.amountRefunded });
      return { handled: "charge.refunded" };
    case "credit.granted":
      store.put("credit_events", {
        id: event.id,
        customerId: event.data.customerId,
        type: "grant",
        amountCents: event.data.amountCents,
      });
      return { handled: "credit.granted" };
    default:
      return { handled: "ignored" };
  }
}

/** Apply a carrier event: append to the order's tracking history. */
function applyCarrierEvent(event) {
  const order = orderRepo.byNumber(event.data?.reference);
  if (!order) return { handled: "unknown_order" };
  const events = [...(order.events || []), { status: event.data.status, at: event.data.at }];
  orderRepo.update(order.id, {
    events,
    shipment: { carrier: event.data.carrier, trackingNumber: event.data.trackingNumber },
  });
  return { handled: "shipment.updated" };
}

function register(router) {
  // POST /webhooks/payments
  router.post("/webhooks/payments", async (ctx) => {
    const verdict = verifyWebhook({
      rawBody: ctx.raw,
      header: ctx.req.headers[SIGNATURE_HEADER],
      secret: config.payments.webhookSecret,
    });
    if (!verdict.valid) {
      ctx.log.warn("rejected payments webhook", { reason: verdict.reason });
      return fail(ctx.res, 401, "invalid_signature", verdict.reason, ctx.requestId);
    }

    const event = ctx.body;
    const result = await webhookEventRepo.applyOnce(event, () => applyPaymentsEvent(event));
    return ok(ctx.res, { received: true, applied: result.applied });
  });

  // POST /webhooks/carrier
  router.post("/webhooks/carrier", async (ctx) => {
    const verdict = verifyWebhook({
      rawBody: ctx.raw,
      header: ctx.req.headers[SIGNATURE_HEADER],
      secret: config.shipping.apiKey,
    });
    if (!verdict.valid) {
      return fail(ctx.res, 401, "invalid_signature", verdict.reason, ctx.requestId);
    }
    const event = ctx.body;
    const result = await webhookEventRepo.applyOnce(event, async () => applyCarrierEvent(event));
    return ok(ctx.res, { received: true, applied: result.applied });
  });
}

module.exports = { register, applyPaymentsEvent, applyCarrierEvent };
