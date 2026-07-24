const store = require("../db/store");
const { filterBy } = require("../db/query");
const { sumCents } = require("../domain/money");

// Refunds issued against orders. Rows look like:
//   { id, orderId, amountCents, reason, lines: [{sku, qty}], createdAt,
//     status: "pending"|"succeeded"|"failed" }

const TABLE = "refunds";

function create(refund) {
  return store.put(TABLE, { status: "pending", createdAt: new Date().toISOString(), ...refund });
}

function byId(id) {
  return store.get(TABLE, id);
}

function update(id, changes) {
  return store.patch(TABLE, id, changes);
}

/** Every refund recorded against an order. */
function byOrder(orderId) {
  return filterBy(store.all(TABLE), { orderId });
}

/**
 * How much has already gone back to the customer for an order.
 *
 * Only refunds that actually SUCCEEDED count — a failed refund attempt
 * did not move money, so it must not consume the order's refundable
 * balance.
 *
 * @param {string} orderId
 * @returns {number} cents already refunded
 */
function refundedTotal(orderId) {
  const succeeded = byOrder(orderId).filter((refund) => refund.status === "succeeded");
  return sumCents(succeeded.map((refund) => refund.amountCents));
}

function all() {
  return store.all(TABLE);
}

module.exports = { create, byId, update, byOrder, refundedTotal, all };
