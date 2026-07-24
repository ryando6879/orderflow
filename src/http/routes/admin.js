const reportingService = require("../../services/reportingService");
const refundService = require("../../services/refundService");
const inventoryService = require("../../services/inventoryService");
const searchIndexService = require("../../services/searchIndexService");
const orderRepo = require("../../repositories/orderRepo");
const { ok, text, created } = require("../respond");
const { requireScope } = require("../middleware/auth");
const { body } = require("../middleware/validate");
const { snapshot } = require("../../config/featureFlags");

// The admin panel's backend. Support and finance live in here all day.

function dateRange(query) {
  const to = query.to || new Date().toISOString();
  const from = query.from || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  return { from, to };
}

function register(router) {
  // GET /admin/reports/revenue?from=&to=
  router.get(
    "/admin/reports/revenue",
    (ctx) => {
      const { from, to } = dateRange(ctx.query);
      return ok(ctx.res, reportingService.revenueSummary(from, to));
    },
    [requireScope("reports:read")]
  );

  // GET /admin/reports/revenue-by-region?from=&to=
  router.get(
    "/admin/reports/revenue-by-region",
    (ctx) => {
      const { from, to } = dateRange(ctx.query);
      return ok(ctx.res, { data: reportingService.revenueByRegion(from, to) });
    },
    [requireScope("reports:read")]
  );

  // GET /admin/exports/orders.csv?from=&to=
  router.get(
    "/admin/exports/orders.csv",
    (ctx) => {
      const { from, to } = dateRange(ctx.query);
      const csv = reportingService.orderExportCsv(from, to);
      ctx.res.setHeader("content-disposition", 'attachment; filename="orders.csv"');
      return text(ctx.res, 200, csv, "text/csv; charset=utf-8");
    },
    [requireScope("reports:read")]
  );

  // POST /admin/orders/:id/refunds
  router.post(
    "/admin/orders/:id/refunds",
    async (ctx) => {
      const refund = await refundService.issueRefund({
        orderId: ctx.params.id,
        amountCents: ctx.body.amountCents,
        reason: ctx.body.reason,
        lines: ctx.body.lines,
      });
      return created(ctx.res, refund, `/admin/refunds/${refund.id}`);
    },
    [requireScope("refunds:write"), body({ amountCents: "number", reason: "string?", lines: "array?" })]
  );

  // GET /admin/orders/:id/refundable
  router.get(
    "/admin/orders/:id/refundable",
    (ctx) => {
      const order = orderRepo.byId(ctx.params.id);
      if (!order) {
        const err = new Error(`order ${ctx.params.id} not found`);
        err.code = "not_found";
        err.statusCode = 404;
        throw err;
      }
      return ok(ctx.res, {
        orderId: order.id,
        total: order.amounts.total,
        refundedTotal: order.refundedTotal || 0,
        refundable: refundService.refundableBalance(order),
      });
    },
    [requireScope("refunds:write")]
  );

  // GET /admin/stock/:sku
  router.get(
    "/admin/stock/:sku",
    (ctx) =>
      ok(ctx.res, {
        sku: ctx.params.sku,
        available: inventoryService.availableForSku(ctx.params.sku),
        warehouses: inventoryService.availabilityBreakdown(ctx.params.sku),
      }),
    [requireScope("admin")]
  );

  // GET /admin/flags
  router.get("/admin/flags", (ctx) => ok(ctx.res, { flags: snapshot() }), [requireScope("admin")]);

  // POST /admin/search/rebuild
  router.post(
    "/admin/search/rebuild",
    (ctx) => ok(ctx.res, { tokens: searchIndexService.rebuild(), stats: searchIndexService.stats() }),
    [requireScope("admin")]
  );
}

module.exports = { register, dateRange };
