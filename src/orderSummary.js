// Order-review page for the storefront client. Turns the raw cart (which can
// hold several separate lines for the same product, one per "add to cart"
// action) into the rows the customer sees on the review screen before paying.

const { getProduct } = require("./catalog");
const { lineTotal } = require("./cart");

/**
 * Build the rows for the order-review page.
 *
 * Contract: each DISTINCT product appears exactly ONCE. If the same SKU was
 * added to the cart in multiple actions, its quantities and line totals are
 * combined into a single row. Rows keep the order in which each product was
 * FIRST added to the cart. Each row carries { sku, name, qty, lineTotal },
 * where `qty` is the combined quantity and `lineTotal` is the combined total
 * in cents across every cart line for that product.
 *
 * @param {{ sku: string, qty: number }[]} items - raw cart lines
 * @returns {{ sku: string, name: string, qty: number, lineTotal: number }[]}
 */
function summarizeCart(items = []) {
  return items.map((item) => {
    const product = getProduct(item.sku);
    return {
      sku: item.sku,
      name: product.name,
      qty: item.qty,
      lineTotal: lineTotal(item),
    };
  });
}

module.exports = { summarizeCart };

if (require.main === module) {
  // The customer added a tee, then added two more of the same tee in a second
  // action, plus a mug. The review page should show TWO rows:
  // "Logo Tee x3" and "Coffee Mug x1".
  const cart = [
    { sku: "TEE-1", qty: 1 },
    { sku: "TEE-1", qty: 2 },
    { sku: "MUG-1", qty: 1 },
  ];
  const rows = summarizeCart(cart);
  console.log("review rows:", rows.map((r) => `${r.name} x${r.qty}`).join(", "));
}
