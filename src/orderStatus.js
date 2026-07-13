// Order status model for the storefront. Fulfillment systems post webhook
// events as an order moves through its journey; this module turns that event
// history into the single status the customer-facing pages display.

const STATUS_ORDER = ["placed", "processing", "shipped", "delivered"];

/**
 * The status an order has reached.
 *
 * Contract: returns the FURTHEST status present in the order's event history,
 * ranked by STATUS_ORDER. Warehouse and carrier webhooks are delivered
 * independently and MAY ARRIVE OUT OF ORDER, so an event's position in the
 * array says nothing about how far the order actually got — a delayed
 * "processing" webhook must never drag a shipped order backwards.
 *
 * @param {{ events: { status: string, at: string }[] }} order
 * @returns {string} one of STATUS_ORDER
 */
function currentStatus(order) {
  const events = order.events || [];
  if (events.length === 0) return STATUS_ORDER[0];
  return events.reduce((furthest, event) => STATUS_ORDER.indexOf(event.status) > STATUS_ORDER.indexOf(furthest) ? event.status : furthest, events[0].status);
}

module.exports = { STATUS_ORDER, currentStatus };
