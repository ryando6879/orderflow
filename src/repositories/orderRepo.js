const store = require("../db/store");
const { filterBy, orderBy, whereIn } = require("../db/query");

// Orders. Rows look like:
//   { id, number, customerId, status, lines[], region, service,
//     amounts: {merchandise, discount, tax, shipping, total},
//     placedAt, updatedAt, shipping?: {address}, refundedTotal }

const TABLE = "orders";

function create(order) {
  return store.put(TABLE, order);
}

function byId(id) {
  return store.get(TABLE, id);
}

/** Look up by the customer-facing order number, e.g. "ORD-7K4M2Q". */
function byNumber(number) {
  return store.all(TABLE).find((order) => order.number === number);
}

function update(id, changes) {
  return store.patch(TABLE, id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Every order for a customer, newest first. */
function byCustomer(customerId) {
  return orderBy(filterBy(store.all(TABLE), { customerId }), "placedAt", "desc");
}

/**
 * A customer's most recent orders — what the account page's "Recent
 * orders" panel and the support sidebar both render.
 *
 * Contract: the NEWEST `limit` orders, newest first. The ordering decides
 * which rows are returned, not just how they are arranged: a customer
 * with fifty orders must see their latest five, not five arbitrary ones.
 *
 * @param {string} customerId
 * @param {number} [limit]
 */
function recentByCustomer(customerId, limit = 5) {
  const rows = filterBy(store.all(TABLE), { customerId });
  const limited = rows.slice(0, limit);
  return orderBy(limited, "placedAt", "desc");
}

/** Orders in any of `statuses`, oldest first (job queues want FIFO). */
function byStatuses(statuses) {
  return orderBy(whereIn(store.all(TABLE), "status", statuses), "placedAt", "asc");
}

/** Orders placed in a closed date range, for the finance export. */
function placedBetween(fromIso, toIso) {
  return orderBy(
    store.all(TABLE).filter((order) => order.placedAt >= fromIso && order.placedAt <= toIso),
    "placedAt",
    "asc"
  );
}

function all() {
  return store.all(TABLE);
}

function count() {
  return store.count(TABLE);
}

module.exports = {
  create,
  byId,
  byNumber,
  update,
  byCustomer,
  recentByCustomer,
  byStatuses,
  placedBetween,
  all,
  count,
};
