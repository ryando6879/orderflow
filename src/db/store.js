// The data store. OrderFlow runs single-instance today, so the store is
// an in-process set of tables with the same shape the Postgres schema
// will have when we move (docs/ARCHITECTURE.md#persistence). Repositories
// are the only code allowed to touch it — services go through them.

const TABLE_NAMES = [
  "customers",
  "orders",
  "carts",
  "stock",
  "subscriptions",
  "credit_events",
  "webhook_events",
  "refunds",
  "shipments",
  "payment_attempts",
];

function emptyTables() {
  return Object.fromEntries(TABLE_NAMES.map((name) => [name, new Map()]));
}

const tables = emptyTables();

/** The Map backing a table. Throws on an unknown table name. */
function table(name) {
  const rows = tables[name];
  if (!rows) {
    throw new Error(`unknown table: ${name}`);
  }
  return rows;
}

/** Every row in a table, insertion-ordered. */
function all(name) {
  return [...table(name).values()];
}

/** One row by primary key, or undefined. */
function get(name, id) {
  return table(name).get(id);
}

/**
 * Insert or replace a row. The row is stored as a shallow copy so callers
 * cannot mutate stored state by holding on to the object they passed.
 */
function put(name, row) {
  if (!row || row.id === undefined) {
    throw new Error(`cannot store a row without an id in ${name}`);
  }
  const copy = { ...row };
  table(name).set(row.id, copy);
  return copy;
}

/** Apply a patch to an existing row. Throws when the row is not there. */
function patch(name, id, changes) {
  const existing = get(name, id);
  if (!existing) {
    const err = new Error(`${name} ${id} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  return put(name, { ...existing, ...changes });
}

/** Delete a row. Returns whether it existed. */
function remove(name, id) {
  return table(name).delete(id);
}

/** Row count. */
function count(name) {
  return table(name).size;
}

/** Drop everything — tests and the seed script use this. */
function truncateAll() {
  for (const name of TABLE_NAMES) {
    table(name).clear();
  }
}

module.exports = { TABLE_NAMES, tables, table, all, get, put, patch, remove, count, truncateAll };
