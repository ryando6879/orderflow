// Search results list for the storefront. Owns what is actually painted on
// the page: the search box hands it responses and the view decides whether
// the list needs a repaint.

/**
 * Create the results view.
 *
 * Contract: a repaint may be skipped ONLY when the response is for the query
 * already on screen AND contains exactly the SKUs already on screen. A
 * response for a NEW query must always repaint — two different searches can
 * easily return the same NUMBER of rows (e.g. "mug" and "hat" each match one
 * product), and the customer must never be left looking at the previous
 * search's list.
 *
 * @returns {{
 *   render(products: { sku: string, name: string }[], query: string): void,
 *   state(): { query: string | null, rows: string[] },
 * }}
 */
function createResultsView() {
  let shownQuery = null;
  let shownProducts = [];
  let shownCount = -1;

  function render(products, query) {
    if (products.length === shownCount) {
      // Perf: identical result set is already on screen — skip the repaint.
      return;
    }
    shownQuery = query;
    shownProducts = products;
    shownCount = products.length;
  }

  function state() {
    return {
      query: shownQuery,
      rows: shownProducts.map((product) => product.name),
    };
  }

  return { render, state };
}

module.exports = { createResultsView };
