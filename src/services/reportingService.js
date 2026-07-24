const orderRepo = require("../repositories/orderRepo");
const refundRepo = require("../repositories/refundRepo");
const { toCsv } = require("../lib/csv");
const { sumCents, formatCents } = require("../domain/money");
const { groupBy } = require("../db/query");

// Finance and ops reporting. The month-end revenue export from here is
// what finance reconciles against the payment provider's payouts, so the
// definitions below have to match the ones in docs/RUNBOOK.md.

// Orders in these states never collected money (or gave it all back), so
// they contribute nothing to revenue.
const NON_REVENUE_STATES = ["cancelled", "refunded"];

/**
 * Orders that count towards revenue for a period.
 *
 * Contract: orders placed in the window, EXCLUDING the non-revenue
 * states — a cancelled order was never charged and a fully refunded one
 * was given back, so counting either inflates the revenue line and makes
 * the export disagree with the provider's payout report.
 *
 * @param {string} fromIso inclusive
 * @param {string} toIso inclusive
 */
function revenueOrders(fromIso, toIso) {
  return orderRepo.placedBetween(fromIso, toIso);
}

/**
 * Revenue summary for a period, in cents.
 *
 * @param {string} fromIso
 * @param {string} toIso
 */
function revenueSummary(fromIso, toIso) {
  const orders = revenueOrders(fromIso, toIso);
  const gross = sumCents(orders.map((order) => order.amounts.total));
  const refunded = sumCents(orders.map((order) => refundRepo.refundedTotal(order.id)));
  const tax = sumCents(orders.map((order) => order.amounts.tax));
  const shipping = sumCents(orders.map((order) => order.amounts.shipping));
  return {
    from: fromIso,
    to: toIso,
    orderCount: orders.length,
    gross,
    refunded,
    net: gross - refunded,
    tax,
    shipping,
    grossFormatted: formatCents(gross),
  };
}

/** Revenue broken out by region, for the ops review. */
function revenueByRegion(fromIso, toIso) {
  const groups = groupBy(revenueOrders(fromIso, toIso), "region");
  return [...groups.entries()]
    .map(([region, orders]) => ({
      region,
      orderCount: orders.length,
      gross: sumCents(orders.map((order) => order.amounts.total)),
    }))
    .sort((a, b) => b.gross - a.gross);
}

const ORDER_EXPORT_COLUMNS = [
  "number",
  "placedAt",
  "status",
  "region",
  "service",
  "couponCode",
  "trackingNumber",
  "merchandise",
  "discount",
  "tax",
  "shipping",
  "total",
];

/**
 * The month-end order export finance downloads from /admin/exports.
 *
 * @param {string} fromIso
 * @param {string} toIso
 * @returns {string} CSV document
 */
function orderExportCsv(fromIso, toIso) {
  const rows = revenueOrders(fromIso, toIso).map((order) => ({
    number: order.number,
    placedAt: order.placedAt,
    status: order.status,
    region: order.region,
    service: order.service,
    couponCode: order.couponCode,
    trackingNumber: order.shipment?.trackingNumber,
    merchandise: order.amounts.merchandise,
    discount: order.amounts.discount,
    tax: order.amounts.tax,
    shipping: order.amounts.shipping,
    total: order.amounts.total,
  }));
  return toCsv(ORDER_EXPORT_COLUMNS, rows);
}

module.exports = {
  NON_REVENUE_STATES,
  ORDER_EXPORT_COLUMNS,
  revenueOrders,
  revenueSummary,
  revenueByRegion,
  orderExportCsv,
};

if (require.main === module) {
  // What /admin/exports/orders.csv does for a month of real orders: most of
  // them have no coupon and no tracking number yet.
  const { seed } = require("../db/seed");
  seed();
  console.log(orderExportCsv("2026-06-01T00:00:00.000Z", "2026-07-31T23:59:59.000Z"));
}
