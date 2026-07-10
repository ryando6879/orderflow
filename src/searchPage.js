// Storefront search page: wires the search box to the results view. This is
// page glue only — matching lives in searchService, staleness handling in
// searchBox, and repaint decisions in resultsView.

const { createSearchBox } = require("./searchBox");
const { createResultsView } = require("./resultsView");

/**
 * Assemble the search page.
 *
 * @returns {{
 *   box: { type(query: string): Promise<void>, query(): string },
 *   view: { state(): { query: string | null, rows: string[] } },
 * }}
 */
function createSearchPage() {
  const view = createResultsView();
  const box = createSearchBox(view);
  return { box, view };
}

module.exports = { createSearchPage };

if (require.main === module) {
  (async () => {
    // Scenario 1 — the customer types "tee" quickly: t → te → tee. The broad
    // "t" search is the slowest, so its response arrives last.
    const fast = createSearchPage();
    await Promise.all([fast.box.type("t"), fast.box.type("te"), fast.box.type("tee")]);
    const s1 = fast.view.state();
    console.log(
      `typed: "tee" | showing results for: ${JSON.stringify(s1.query)} — ${s1.rows.join(", ")}`
    );

    // Scenario 2 — two settled searches in a row: "mug", then "hat". Each
    // matches exactly one product.
    const settled = createSearchPage();
    await settled.box.type("mug");
    await settled.box.type("hat");
    const s2 = settled.view.state();
    console.log(
      `typed: "hat" | showing results for: ${JSON.stringify(s2.query)} — ${s2.rows.join(", ")}`
    );
  })();
}
