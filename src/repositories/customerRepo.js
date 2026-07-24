const store = require("../db/store");
const { filterBy } = require("../db/query");

// Customers. Rows look like:
//   { id, email, name, lifetimeSpend, createdAt,
//     contacts: [{ kind: "primary"|"billing"|"shipping", email, phone }],
//     addresses: [...], flags: { blocked?: boolean } }

const TABLE = "customers";

function create(customer) {
  return store.put(TABLE, customer);
}

function byId(id) {
  return store.get(TABLE, id);
}

/** Look up by email. Emails are stored lowercase. */
function byEmail(email) {
  const needle = String(email || "").trim().toLowerCase();
  return store.all(TABLE).find((customer) => customer.email === needle);
}

function update(id, changes) {
  return store.patch(TABLE, id, changes);
}

/**
 * Load a customer or throw a 404 — used by request handlers that cannot
 * continue without one.
 */
function requireById(id) {
  const customer = byId(id);
  if (!customer) {
    const err = new Error(`customer ${id} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  return customer;
}

/** Add spend to a customer's lifetime total (drives their loyalty tier). */
function addLifetimeSpend(id, cents) {
  const customer = requireById(id);
  return update(id, { lifetimeSpend: (customer.lifetimeSpend || 0) + cents });
}

/** Customers matching simple filters, for the admin list. */
function search(where) {
  return filterBy(store.all(TABLE), where);
}

function all() {
  return store.all(TABLE);
}

module.exports = { create, byId, byEmail, update, requireById, addLifetimeSpend, search, all };
