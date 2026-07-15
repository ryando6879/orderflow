const { refundAmount } = require("./refunds");

/**
 * Customer returns, end to end: the merchandise refund comes from the
 * order's capture record, and shipping is refunded only when the whole
 * order comes back.
 */

/**
 * Process a return: refund the returned merchandise, and refund shipping
 * only when every unit of every line in the order is returned.
 *
 * @param {{lines: Array<{sku: string, qty: number, paid: number}>,
 *          shippingPaid: number}} record from captureOrder (payment.js)
 * @param {Array<{sku: string, qty: number}>} returnedItems
 * @returns {{merchandise: number, shipping: number, total: number}} cents
 */
function processReturn(record, returnedItems) {
  const merchandise = refundAmount(record.lines, returnedItems);
  const fullReturn = record.lines.every((line) => {
    const returned = returnedItems.find((item) => item.sku === line.sku);
    return returned !== undefined && returned.qty >= line.qty;
  });
  const shipping = fullReturn ? record.shippingPaid : 0;
  return { merchandise, shipping, total: merchandise + shipping };
}

module.exports = { processReturn };

if (require.main === module) {
  const { lineTotal } = require("./cart");
  const { buildInvoice } = require("./invoice");
  const { shippingCost } = require("./shipping");
  const { captureOrder } = require("./payment");

  // A gold member ordered 3 tees and a sale hat, then returns 2 tees.
  const items = [
    { sku: "TEE-1", qty: 3 },
    { sku: "HAT-1", qty: 1 },
  ];
  const lines = items.map((item) => ({ ...item, lineSubtotal: lineTotal(item) }));
  const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const shipping = shippingCost("us", 4);
  const invoice = buildInvoice({ subtotal, shipping }, { lifetimeSpend: 150000 });
  const record = captureOrder("ORD-1001", lines, invoice, shipping);
  console.log(
    "refund for returning 2 of 3 tees:",
    processReturn(record, [{ sku: "TEE-1", qty: 2 }])
  );
}
