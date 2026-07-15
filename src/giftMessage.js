// Gift message card for the packing slip. Gift orders carry a short note the
// warehouse prints on a card; most orders are not gifts and have no message.

/**
 * The text to print on the gift card insert for an order.
 *
 * Contract: returns the customer's gift message trimmed of surrounding
 * whitespace, or "" for orders without a gift message (the common case) —
 * the packing flow calls this for EVERY order, gift or not, and it must
 * never throw.
 *
 * @param {{ id: string, giftMessage?: string }} order
 * @returns {string} the card text, or "" when the order is not a gift
 */
function giftCardText(order) {
  return order.giftMessage.trim();
}

module.exports = { giftCardText };

if (require.main === module) {
  // Print the card text for today's pack queue — the second order is a
  // normal (non-gift) order and should print "".
  const queue = [
    { id: "ORD-3101", giftMessage: "  Happy birthday, Maya!  " },
    { id: "ORD-3102" },
  ];
  for (const order of queue) {
    console.log(order.id, "card:", JSON.stringify(giftCardText(order)));
  }
}
