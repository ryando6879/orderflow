const orderRepo = require("../repositories/orderRepo");
const customerRepo = require("../repositories/customerRepo");
const { transition, canTransition } = require("../domain/orderStates");
const { currentStatus } = require("../orderStatus");
const { promiseFor } = require("../domain/slaClock");
const inventoryService = require("./inventoryService");
const notificationService = require("./notificationService");
const { logger } = require("../lib/logger");

// Order lifecycle operations. Anything that moves an order forward lives
// here; the state machine in domain/orderStates.js decides what is legal.

/** Load an order by id, or throw a 404. */
function requireOrder(id) {
  const order = orderRepo.byId(id);
  if (!order) {
    const err = new Error(`order ${id} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  return order;
}

/**
 * Move an order to a new state and persist it.
 *
 * @param {string} orderId
 * @param {string} to target state
 * @returns {object} the updated order
 */
function moveTo(orderId, to) {
  const order = requireOrder(orderId);
  const moved = transition(order, to);
  logger.info("order state changed", { orderId, from: order.status, to });
  return orderRepo.update(orderId, { status: moved.status });
}

/** Whether support can refund part of this order right now. */
function canPartiallyRefund(orderId) {
  const order = requireOrder(orderId);
  return canTransition(order.status, "partially_refunded");
}

/** Mark an order paid and send the confirmation. */
async function markPaid(orderId) {
  const order = moveTo(orderId, "paid");
  const customer = customerRepo.byId(order.customerId);
  if (customer) {
    await notificationService.sendOrderConfirmation(customer, order);
  }
  return order;
}

/** Fulfil an order: ship the reserved units and notify the customer. */
async function fulfil(orderId, shipment) {
  const order = requireOrder(orderId);
  for (const line of order.lines) {
    if (shipment.warehouseId) {
      inventoryService.shipUnits(line.sku, shipment.warehouseId, line.qty);
    }
  }
  const fulfilled = moveTo(orderId, "fulfilled");
  const customer = customerRepo.byId(order.customerId);
  if (customer) {
    await notificationService.sendShipmentNotice(customer, fulfilled, shipment);
  }
  return fulfilled;
}

/** Cancel an order and release its stock. */
function cancel(orderId, reason) {
  const order = requireOrder(orderId);
  const cancelled = moveTo(orderId, "cancelled");
  logger.info("order cancelled", { orderId, reason });
  return cancelled;
}

/**
 * The customer-facing view of an order: status derived from the event
 * history, the promise date, and the amounts.
 */
function publicView(orderId) {
  const order = requireOrder(orderId);
  return {
    number: order.number,
    status: currentStatus(order),
    placedAt: order.placedAt,
    promisedBy: order.service === "digital" ? null : promiseFor(order.placedAt.slice(0, 10), order.service),
    lines: order.lines.map((line) => ({ sku: line.sku, qty: line.qty })),
    amounts: order.amounts,
  };
}

module.exports = { requireOrder, moveTo, canPartiallyRefund, markPaid, fulfil, cancel, publicView };
