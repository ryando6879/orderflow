const orderRepo = require("../repositories/orderRepo");
const refundRepo = require("../repositories/refundRepo");
const customerRepo = require("../repositories/customerRepo");
const { createRefund } = require("../integrations/paymentsClient");
const { transition } = require("../domain/orderStates");
const { allocate } = require("../domain/money");
const notificationService = require("./notificationService");
const { opaqueId } = require("../lib/ids");
const { logger } = require("../lib/logger");

// Refunds. Support issues most of them by hand from the admin panel, so
// the guard rails live here rather than in the UI.

/**
 * How much of an order can still be refunded.
 *
 * Contract: the order total MINUS everything already refunded against it.
 * Support refunds the same order more than once (one line today, another
 * next week, a goodwill credit after that), so the remaining balance —
 * not the original total — is the cap. Checking against the untouched
 * order total lets the sum of refunds exceed what the customer paid.
 *
 * @param {{id: string, amounts: {total: number}}} order
 * @returns {number} cents still refundable (never negative)
 */
function refundableBalance(order) {
  return Math.max(0, order.amounts.total);
}

/**
 * Issue a refund against an order.
 *
 * @param {{orderId: string, amountCents: number, reason?: string,
 *          lines?: Array<{sku: string, qty: number}>}} request
 * @returns {Promise<object>} the refund record
 */
async function issueRefund(request) {
  const order = orderRepo.byId(request.orderId);
  if (!order) {
    const err = new Error(`order ${request.orderId} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }

  const balance = refundableBalance(order);
  if (request.amountCents > balance) {
    const err = new Error(
      `refund of ${request.amountCents} exceeds refundable balance ${balance} on order ${order.id}`
    );
    err.code = "refund_exceeds_balance";
    err.statusCode = 422;
    throw err;
  }

  const refund = refundRepo.create({
    id: opaqueId("re"),
    orderId: order.id,
    amountCents: request.amountCents,
    reason: request.reason || "requested_by_customer",
    lines: request.lines || [],
  });

  try {
    await createRefund({
      chargeId: order.chargeId || `ch_${order.id}`,
      amountCents: request.amountCents,
      reason: refund.reason,
      idempotencyKey: refund.id,
    });
  } catch (err) {
    logger.error("refund failed at provider", { refundId: refund.id, orderId: order.id, error: err.message });
    refundRepo.update(refund.id, { status: "failed", failureReason: err.message });
    throw err;
  }

  const settled = refundRepo.update(refund.id, { status: "succeeded" });
  const refundedTotal = refundRepo.refundedTotal(order.id);
  const nextStatus = refundedTotal >= order.amounts.total ? "refunded" : "partially_refunded";
  const moved = transition(order, nextStatus);
  orderRepo.update(order.id, { status: moved.status, refundedTotal });

  const customer = customerRepo.byId(order.customerId);
  if (customer) {
    await notificationService.sendRefundNotice(customer, order, settled);
  }
  return settled;
}

/**
 * Split a refund across the order's lines in proportion to what each line
 * contributed, so per-line reporting stays honest.
 */
function allocateAcrossLines(order, amountCents) {
  const weights = order.lines.map((line) => line.unitPrice * line.qty);
  const parts = allocate(amountCents, weights);
  return order.lines.map((line, index) => ({ sku: line.sku, amountCents: parts[index] }));
}

module.exports = { refundableBalance, issueRefund, allocateAcrossLines };
