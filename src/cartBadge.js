// Header mini-cart badge for the storefront client. Renders the little count
// shown next to the cart icon so the customer can see how much is in their cart
// at a glance, from any page.

/**
 * Text for the header cart badge, e.g. "0 items", "1 item", "5 items".
 *
 * Contract: the count is the TOTAL number of units in the cart — the sum of
 * every line's quantity, NOT the number of distinct products. A cart holding
 * two tees and three mugs reads "5 items". The label is pluralized: exactly one
 * unit reads "1 item", everything else reads "<n> items".
 *
 * @param {{ sku: string, qty: number }[]} items - cart lines
 * @returns {string} the badge label
 */
function cartBadgeText(items = []) {
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  return `${count} ${count === 1 ? "item" : "items"}`;
}

module.exports = { cartBadgeText };

if (require.main === module) {
  // Customer has two tees and three mugs in their cart: the header badge
  // should read "5 items".
  const cart = [
    { sku: "TEE-1", qty: 2 },
    { sku: "MUG-1", qty: 3 },
  ];
  console.log("cart badge:", JSON.stringify(cartBadgeText(cart)));
}
