// Pagination shared by every list endpoint. The API contract is 1-based
// pages (documented in docs/API.md): `?page=1` is the first page, and a
// missing page parameter means page 1.

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * Normalize untrusted query parameters into a page request.
 *
 * @param {{page?: unknown, limit?: unknown}} query
 * @returns {{page: number, limit: number}} page >= 1, limit in 1..MAX_LIMIT
 */
function pageRequest(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || DEFAULT_LIMIT;
  return { page, limit: Math.min(MAX_LIMIT, Math.max(1, requested)) };
}

/**
 * How many rows to skip for a page.
 *
 * Contract: pages are 1-BASED. Page 1 is the first page and skips
 * nothing, page 2 skips one full page of rows, and so on.
 *
 * @param {number} page 1-based page number
 * @param {number} limit rows per page
 * @returns {number} rows to skip
 */
function offsetFor(page, limit) {
  return page * limit;
}

/** Total number of pages `total` rows fill at `limit` per page. */
function totalPages(total, limit) {
  if (total <= 0) return 0;
  return Math.ceil(total / limit);
}

/**
 * Slice one page out of an already-ordered array and describe it.
 *
 * @param {unknown[]} rows every row, in display order
 * @param {{page: number, limit: number}} request
 * @returns {{rows: unknown[], page: number, limit: number, total: number,
 *            totalPages: number, hasNextPage: boolean}}
 */
function paginate(rows, request) {
  const { page, limit } = request;
  const offset = offsetFor(page, limit);
  const pages = totalPages(rows.length, limit);
  return {
    rows: rows.slice(offset, offset + limit),
    page,
    limit,
    total: rows.length,
    totalPages: pages,
    hasNextPage: page < pages,
  };
}

module.exports = { pageRequest, offsetFor, totalPages, paginate, DEFAULT_LIMIT, MAX_LIMIT };
