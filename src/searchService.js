// Storefront product search backend client. Matches the customer's query
// against the catalog and resolves with the matching products. Latency is
// simulated the way the production search service behaves: broad (short)
// queries scan more of the catalog and take longer than narrow ones.

const { getProduct } = require("./catalog");

// Every SKU the storefront search can surface.
const SEARCH_SKUS = ["TEE-1", "MUG-1", "HAT-1", "STK-1"];

const MIN_LATENCY_MS = 10;

/**
 * Simulated network latency for a query, in milliseconds. Short, broad
 * queries take longer (the backend scans more of the catalog), which means a
 * response for an earlier, broader query can arrive AFTER the response for a
 * later, narrower one.
 *
 * @param {string} query
 * @returns {number} latency in ms
 */
function searchLatency(query) {
  return Math.max(MIN_LATENCY_MS, 40 - query.length * 10);
}

/**
 * Search the catalog for products whose name contains the query,
 * case-insensitively. Resolves with `{ sku, name, price }` rows in catalog
 * order.
 *
 * @param {string} query
 * @returns {Promise<{ sku: string, name: string, price: number }[]>}
 */
function searchProducts(query) {
  const needle = query.toLowerCase();
  const matches = SEARCH_SKUS.map((sku) => ({ sku, ...getProduct(sku) }))
    .filter((product) => product.name.toLowerCase().includes(needle))
    .map(({ sku, name, price }) => ({ sku, name, price }));
  return new Promise((resolve) => {
    setTimeout(() => resolve(matches), searchLatency(query));
  });
}

module.exports = { searchProducts, searchLatency };
