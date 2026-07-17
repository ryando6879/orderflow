// Sort helper for the account order-history list. Kept separate from the page
// assembly so other surfaces (exports, support tools) can reuse the ordering.

/**
 * Sort orders for display in the account order-history list.
 *
 * Contract: NEWEST first — the most recently placed order is always the first
 * row, descending from there. `placedAt` is a millisecond epoch timestamp.
 * Returns a new array; the input is never modified.
 *
 * @param {{ placedAt: number }[]} orders
 * @returns {object[]} a new array with the newest order first
 */
function sortForHistory(orders) {
  return [...orders].sort((a, b) => b.placedAt - a.placedAt);
}

module.exports = { sortForHistory };
