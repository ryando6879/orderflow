const store = require("../db/store");
const { filterBy, orderBy } = require("../db/query");

// Guest and signed-in carts. Rows look like:
//   { id, customerId?, sessionId, items: [{sku, qty}], region,
//     createdAt, updatedAt, convertedOrderId?: string }

const TABLE = "carts";

function create(cart) {
  return store.put(TABLE, { items: [], ...cart });
}

function byId(id) {
  return store.get(TABLE, id);
}

/** The live cart for a browser session, if there is one. */
function bySession(sessionId) {
  return store.all(TABLE).find((cart) => cart.sessionId === sessionId && !cart.convertedOrderId);
}

function update(id, changes) {
  return store.patch(TABLE, id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Replace the item list on a cart. */
function setItems(id, items) {
  return update(id, { items });
}

/** Mark a cart as having become an order — it is no longer live. */
function markConverted(id, orderId) {
  return update(id, { convertedOrderId: orderId });
}

/** Carts that never became orders, oldest first. */
function openCarts() {
  const open = store.all(TABLE).filter((cart) => !cart.convertedOrderId && cart.items.length > 0);
  return orderBy(open, "updatedAt", "asc");
}

/** Carts belonging to a customer. */
function byCustomer(customerId) {
  return filterBy(store.all(TABLE), { customerId });
}

function remove(id) {
  return store.remove(TABLE, id);
}

module.exports = { create, byId, bySession, update, setItems, markConverted, openCarts, byCustomer, remove };
