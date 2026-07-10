// Account summary strip for the account page: "N orders · $X.XX spent
// this year". Renders above the order-history table and must always
// agree with the rows below it.

const { chargedAmount, orderRow } = require("./orderHistory");

/**
 * Total the customer has spent this year, in cents.
 *
 * Contract: sums the charged amount of every order EXCEPT cancelled
 * ones — a cancelled order is refunded in full, so it never counts as
 * money spent.
 */
function totalSpent(orders) {
  return orders.filter(order => !order.cancelled).reduce((sum, order) => sum + chargedAmount(order), 0);
}

/**
 * The headline line for the summary strip.
 *
 * Contract: "<count> orders · $<spent> this year", where <count> leaves
 * out cancelled orders (the strip and the number below it must agree on
 * what "an order you paid for" means).
 *
 * @param {Array<object>} orders
 * @returns {string}
 */
function headline(orders) {
  const count = orders.filter((order) => !order.cancelled).length;
  const dollars = (totalSpent(orders) / 100).toFixed(2);
  return `${count} orders · $${dollars} this year`;
}

if (require.main === module) {
  const orders = [
    { id: "ORD-3101", placedAt: "2026-07-02T09:00:00Z", subtotal: 4800, total: 5484 },
    { id: "ORD-3108", placedAt: "2026-07-04T14:00:00Z", subtotal: 2500, total: 2930, cancelled: true },
    { id: "ORD-3117", placedAt: "2026-07-08T11:00:00Z", subtotal: 6200, total: 7096 },
  ];
  for (const order of orders) console.log(orderRow(order));
  console.log(headline(orders));
}

module.exports = { totalSpent, headline };
