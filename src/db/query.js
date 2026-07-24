// Small query helpers over the in-memory tables. These exist so that the
// repositories read like queries and so the eventual move to SQL is a
// change in one layer.

const { paginate } = require("../lib/pagination");

/**
 * Filter rows by exact field match. A `undefined` value in the filter is
 * ignored, so callers can pass optional query parameters straight in.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {Record<string, unknown>} where
 */
function filterBy(rows, where = {}) {
  const conditions = Object.entries(where).filter(([, value]) => value !== undefined);
  if (conditions.length === 0) return [...rows];
  return rows.filter((row) => conditions.every(([field, value]) => row[field] === value));
}

/**
 * Sort rows by a field. Strings compare lexicographically, numbers
 * numerically. The sort is stable (Array#sort is stable in Node 12+), so
 * equal keys keep insertion order.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {string} field
 * @param {"asc"|"desc"} [direction]
 */
function orderBy(rows, field, direction = "asc") {
  const sign = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (left === right) return 0;
    return (left > right ? 1 : -1) * sign;
  });
}

/** Rows whose `field` is in `values`. */
function whereIn(rows, field, values) {
  const set = new Set(values);
  return rows.filter((row) => set.has(row[field]));
}

/** Rows whose `field` timestamp is at or after `sinceIso`. */
function since(rows, field, sinceIso) {
  return rows.filter((row) => row[field] !== undefined && row[field] >= sinceIso);
}

/** Group rows into a Map keyed by a field value. */
function groupBy(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

/** Filter, order, then page — the shape every list endpoint wants. */
function list(rows, { where, sort, direction, page }) {
  let result = filterBy(rows, where);
  if (sort) result = orderBy(result, sort, direction);
  return paginate(result, page);
}

module.exports = { filterBy, orderBy, whereIn, since, groupBy, list };
