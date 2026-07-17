// Guest order lookup for the storefront "Find my order" page. Customers who
// checked out as guests can pull up an order with just the order number from
// their confirmation email plus the email address they used — no sign-in.

/**
 * Find the order matching an order number and the purchaser's email address.
 *
 * Contract: the order number must match exactly. The EMAIL comparison is
 * forgiving — customers re-type their address by hand, so it must ignore
 * letter case and surrounding whitespace on either side: " Jane@Example.COM "
 * finds an order stored as "jane@example.com". Returns null when no order
 * matches both.
 *
 * @param {{ orderNumber: string, email: string, items: number }[]} orders
 * @param {string} orderNumber - as printed on the confirmation email
 * @param {string} email - as typed by the customer
 * @returns {object|null} the matching order, or null
 */
function findOrder(orders, orderNumber, email) {
  return (
    orders.find(
      (order) => order.orderNumber === orderNumber && order.email.trim().toLowerCase() === email.trim().toLowerCase()
    ) || null
  );
}

module.exports = { findOrder };

if (require.main === module) {
  // Jane checked out as a guest with "jane@example.com". Later she looks the
  // order up from her phone, typing her address the way she usually writes it.
  const orders = [
    { orderNumber: "ORD-7001", email: "jane@example.com", items: 2 },
    { orderNumber: "ORD-7002", email: "sam@example.com", items: 1 },
  ];
  const found = findOrder(orders, "ORD-7001", "Jane@Example.com ");
  console.log(
    "order lookup:",
    found
      ? `found ${found.orderNumber} (${found.items} items)`
      : "no order found"
  );
}
