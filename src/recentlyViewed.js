// "Recently viewed" strip for the shop page. Tracks the products a shopper
// has opened this session so the strip can offer a quick way back to them.

const MAX_RECENT = 4;

/**
 * Record a product view and return the updated recently-viewed list.
 *
 * Contract: the list holds the skus of the last MAX_RECENT DISTINCT products
 * viewed, most recent FIRST. Viewing a product again moves its sku to the
 * front — a sku never appears twice. Once the list is full, the oldest entry
 * falls off the end to make room. The input list is never modified.
 *
 * @param {string[]} list - the current recently-viewed skus
 * @param {string} sku - the product just opened
 * @returns {string[]} the updated list, newest first
 */
function recordView(list, sku) {
  const next = [sku, ...list.filter(s => s !== sku)];
  return next.slice(0, MAX_RECENT);
}

module.exports = { recordView, MAX_RECENT };

if (require.main === module) {
  // A shopper browses five products, going back to the mug once in between.
  // The strip should read newest-first with no repeats.
  const views = ["TEE-1", "MUG-1", "HAT-1", "STK-1", "MUG-1", "POSTER-1"];
  let list = [];
  for (const sku of views) list = recordView(list, sku);
  console.log("recently viewed:", list.join(", "));
}
