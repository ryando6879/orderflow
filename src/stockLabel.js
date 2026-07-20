// Availability label for the product page. Tells the shopper whether an item
// can still be ordered before they add it to their cart.

const LOW_STOCK_THRESHOLD = 5;

/**
 * Availability label shown on the product page.
 *
 * Contract: availability is the number of units ACTUALLY still promisable —
 * the units on hand in the warehouse MINUS the units already reserved by
 * pending (paid but unshipped) orders. "Out of stock" when nothing is
 * promisable, "Only N left" when 1 <= N <= LOW_STOCK_THRESHOLD, "In stock"
 * otherwise. A product with 4 on hand and 4 reserved must read "Out of
 * stock" — those units are already sold to other customers.
 *
 * @param {{ sku: string, onHand: number, reserved: number }} product
 * @returns {string} the label to render on the product page
 */
function stockLabel(product) {
  const available = product.onHand - product.reserved;
  if (available <= 0) return "Out of stock";
  if (available <= LOW_STOCK_THRESHOLD) return `Only ${available} left`;
  return "In stock";
}

module.exports = { stockLabel, LOW_STOCK_THRESHOLD };

if (require.main === module) {
  // Flash-sale item: 4 units on the shelf, all 4 already reserved by pending
  // orders. The product page should read "Out of stock".
  const hotItem = { sku: "MUG-1", onHand: 4, reserved: 4 };
  console.log("hot item label:", JSON.stringify(stockLabel(hotItem)));
}
