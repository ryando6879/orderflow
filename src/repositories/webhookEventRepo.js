const store = require("../db/store");

// Inbound webhook events from the payments provider and the carrier.
//
// Both providers deliver AT LEAST ONCE: after a timeout or a slow ack
// they re-send the SAME event — same `id`, same body — sometimes minutes
// later, sometimes days later. Every event id must be applied exactly
// once, which is what this table is for.

const TABLE = "webhook_events";

/**
 * Whether an event has already been applied.
 *
 * Contract: identity is the provider's EVENT ID. A provider sends many
 * events of the same type for the same order over an order's life
 * (`charge.succeeded` for the order and later for a subscription renewal,
 * several `shipment.updated` events as a parcel moves), so the event type
 * says nothing about whether this particular delivery is a replay.
 *
 * @param {{id: string, type: string}} event
 * @returns {boolean} true when this exact event was already applied
 */
function alreadyApplied(event) {
  return store.all(TABLE).some((seen) => seen.id === event.id);
}

/**
 * Record an event as applied.
 *
 * @param {{id: string, type: string, orderId?: string}} event
 */
function markApplied(event) {
  return store.put(TABLE, {
    id: event.id,
    type: event.type,
    orderId: event.orderId,
    appliedAt: new Date().toISOString(),
  });
}

/**
 * Apply `handler` for an event only the first time it is delivered.
 *
 * @param {{id: string, type: string, orderId?: string}} event
 * @param {() => Promise<unknown>} handler
 * @returns {Promise<{applied: boolean, result?: unknown}>}
 */
async function applyOnce(event, handler) {
  if (alreadyApplied(event)) {
    return { applied: false };
  }
  const result = await handler();
  markApplied(event);
  return { applied: true, result };
}

function byId(id) {
  return store.get(TABLE, id);
}

function all() {
  return store.all(TABLE);
}

module.exports = { alreadyApplied, markApplied, applyOnce, byId, all };
