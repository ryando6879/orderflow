// Account order-history page: assembles the rows for one page of a customer's
// past orders. The account UI renders exactly what this returns.

const { sortForHistory } = require("./orderSort");

const PAGE_SIZE = 3;

/**
 * One page of the customer's order history.
 *
 * Contract: orders are listed newest first (see sortForHistory) and split
 * into pages of PAGE_SIZE rows. `page` is 1-based: page 1 shows the newest
 * PAGE_SIZE orders, page 2 the next PAGE_SIZE, and so on until the list runs
 * out — only a page past the end of the list returns an empty array.
 *
 * @param {{ orderNumber: string, placedAt: number }[]} orders
 * @param {number} page - 1-based page number
 * @returns {object[]} the rows for that page
 */
function historyPage(orders, page) {
  const sorted = sortForHistory(orders);
  const start = (page - 1) * PAGE_SIZE;
  return sorted.slice(start, PAGE_SIZE);
}

module.exports = { historyPage, PAGE_SIZE };

if (require.main === module) {
  // A regular customer with five past orders opens her order history. Page 1
  // should start with yesterday's order; page 2 should hold the two oldest.
  const day = 24 * 60 * 60 * 1000;
  const now = 1784200000000;
  const orders = [
    { orderNumber: "ORD-5001", placedAt: now - 200 * day },
    { orderNumber: "ORD-5002", placedAt: now - 150 * day },
    { orderNumber: "ORD-5003", placedAt: now - 90 * day },
    { orderNumber: "ORD-5004", placedAt: now - 30 * day },
    { orderNumber: "ORD-5005", placedAt: now - 1 * day },
  ];
  for (const page of [1, 2]) {
    const rows = historyPage(orders, page);
    console.log(
      `history page ${page}:`,
      rows.length
        ? rows.map((o) => o.orderNumber).join(", ")
        : "(no orders)"
    );
  }
}
