const orderRepo = require("../../repositories/orderRepo");
const orderService = require("../../services/orderService");
const { ok, page } = require("../respond");
const { pageRequest } = require("../../lib/pagination");
const { list } = require("../../db/query");
const { requireScope } = require("../middleware/auth");

// Order read and lifecycle endpoints. The admin panel and the customer
// account page both read through here; the shapes differ (admin sees
// internal ids and the risk score, customers do not).

/**
 * The one-line address shown next to an order in the admin list, the
 * support sidebar and the packing queue.
 *
 * Contract: DIGITAL orders — gift cards, plan credits, store credit
 * top-ups — have no shipping block at all, because nothing physical
 * ships. Those render as "No shipping"; every other order renders as
 * "City, ST 12345".
 *
 * @param {{shipping?: {address?: {city: string, state: string, zip: string}}}} order
 * @returns {string}
 */
function shippingSummary(order) {
  const address = order.shipping.address;
  return address ? `${address.city}, ${address.state} ${address.zip}` : "No shipping";
}

/** The admin view of an order row. */
function adminRow(order) {
  return {
    id: order.id,
    number: order.number,
    customerId: order.customerId,
    status: order.status,
    placedAt: order.placedAt,
    region: order.region,
    service: order.service,
    shipTo: shippingSummary(order),
    total: order.amounts.total,
    refundedTotal: order.refundedTotal || 0,
    riskScore: order.riskScore,
    reviewHold: Boolean(order.reviewHold),
  };
}

function register(router) {
  // GET /v1/orders?status=paid&page=1&limit=25
  router.get(
    "/v1/orders",
    (ctx) => {
      const result = list(orderRepo.all(), {
        where: { status: ctx.query.status, region: ctx.query.region },
        sort: "placedAt",
        direction: "desc",
        page: pageRequest(ctx.query),
      });
      return page(ctx.res, { ...result, rows: result.rows.map(adminRow) });
    },
    [requireScope("orders:read")]
  );

  // GET /v1/orders/:id
  router.get(
    "/v1/orders/:id",
    (ctx) => {
      const order = orderService.requireOrder(ctx.params.id);
      return ok(ctx.res, adminRow(order));
    },
    [requireScope("orders:read")]
  );

  // GET /v1/orders/by-number/:number — what support types in first.
  router.get(
    "/v1/orders/by-number/:number",
    (ctx) => {
      const order = orderRepo.byNumber(ctx.params.number.toUpperCase());
      if (!order) {
        const err = new Error(`no order numbered ${ctx.params.number}`);
        err.code = "not_found";
        err.statusCode = 404;
        throw err;
      }
      return ok(ctx.res, adminRow(order));
    },
    [requireScope("orders:read")]
  );

  // GET /v1/customers/:id/orders/recent — the account page panel.
  router.get(
    "/v1/customers/:id/orders/recent",
    (ctx) => {
      const limit = Number.parseInt(ctx.query.limit, 10) || 5;
      const orders = orderRepo.recentByCustomer(ctx.params.id, limit);
      return ok(ctx.res, { data: orders.map((order) => orderService.publicView(order.id)) });
    },
    [requireScope("orders:read")]
  );

  // POST /v1/orders/:id/cancel
  router.post(
    "/v1/orders/:id/cancel",
    (ctx) => {
      const order = orderService.cancel(ctx.params.id, ctx.body.reason || "support_request");
      return ok(ctx.res, adminRow(order));
    },
    [requireScope("orders:write")]
  );

  // POST /v1/orders/:id/fulfil
  router.post(
    "/v1/orders/:id/fulfil",
    async (ctx) => {
      const order = await orderService.fulfil(ctx.params.id, {
        warehouseId: ctx.body.warehouseId,
        carrier: ctx.body.carrier,
        trackingNumber: ctx.body.trackingNumber,
      });
      return ok(ctx.res, adminRow(order));
    },
    [requireScope("orders:write")]
  );
}

module.exports = { register, shippingSummary, adminRow };
