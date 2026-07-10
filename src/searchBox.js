// Search box controller for the storefront header. Every keystroke kicks off
// a catalog search; when a response arrives, the results view is repainted.

const { searchProducts } = require("./searchService");

/**
 * Create the search box controller wired to a results view.
 *
 * Contract for `type`: search responses arrive OUT OF ORDER — broad queries
 * are slower than narrow ones (see searchLatency) — so a response for
 * anything other than the LATEST typed query is stale and MUST be dropped,
 * never rendered. Only results for the query currently in the box may reach
 * the view.
 *
 * @param {{ render(products: object[], query: string): void }} view
 * @returns {{ type(query: string): Promise<void>, query(): string }}
 */
function createSearchBox(view) {
  let currentQuery = "";

  /**
   * The customer typed; the box now holds `query`.
   *
   * @param {string} query
   * @returns {Promise<void>} settles once this keystroke's response is handled
   */
  function type(query) {
    currentQuery = query;
    return searchProducts(query).then((products) => {
      view.render(products, query);
    });
  }

  return { type, query: () => currentQuery };
}

module.exports = { createSearchBox };
