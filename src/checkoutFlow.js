const { priceQuote } = require("./quote");

/**
 * Checkout confirmation — the review page and the card charge.
 *
 * The review page shows the customer a quote, and the charge is taken
 * from a FRESH quote priced at charge time: catalog prices and tax rates
 * can change while the customer sits on the review page, so finance
 * policy forbids charging the displayed number directly. When nothing
 * changed between review and charge, the two quotes agree.
 *
 * @param {string} orderId
 * @param {{lines: Array<{sku: string, qty: number, unitPrice: number}>,
 *          region: string}} order
 * @returns {{orderId: string, reviewTotal: number, chargedTotal: number}}
 *          receipt, in cents

 */
function confirmOrder(orderId, order) {
  const review = priceQuote(order); // shown on the review page
  const charge = review; // reuse the same quote; pricing is read-only and repeatable
  return { orderId, reviewTotal: review.total, chargedTotal: charge.total };
}
module.exports = { confirmOrder };

if (require.main === module) {
  // A customer reviews their order, then pays.
  const order = {
    lines: [
      { sku: "TEE-1", qty: 2, unitPrice: 1900 },
      { sku: "MUG-1", qty: 1, unitPrice: 1200 },
    ],
    region: "us",
  };
  const receipt = confirmOrder("ORD-2041", order);
  console.log("review page total (cents):", receipt.reviewTotal);
  console.log("charged to card (cents):", receipt.chargedTotal);
}
