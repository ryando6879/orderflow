/**
 * Payment capture — the durable record of what a customer actually paid.
 * Refunds and disputes are settled from this record alone: the member's
 * tier and the day's promotions are gone after checkout, so the paid
 * amounts recorded here are the only source of truth for servicing.
 */

/**
 * Capture a paid order for later servicing (returns, disputes).
 *
 * Each cart line is recorded with the amount the customer actually paid
 * for it: the order-level discounts (member + promotion) are allocated
 * across lines in proportion to each line's share of the merchandise
 * subtotal. Shipping is captured separately and is never folded into
 * line amounts.
 *
 * @param {string} orderId
 * @param {Array<{sku: string, qty: number, lineSubtotal: number}>} lines
 *        priced cart lines, in cents
 * @param {{discount: number, promoDiscount: number}} invoice
 *        the invoice built for this order (see invoice.js)
 * @param {number} shipping shipping charged for the order, in cents
 * @returns {{orderId: string,
 *            lines: Array<{sku: string, qty: number, paid: number}>,
 *            shippingPaid: number}} the capture record, in cents
 */
function captureOrder(orderId, lines, invoice, shipping) {
  const orderDiscount = invoice.discount + invoice.promoDiscount;
  const merchandiseSubtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
  const captured = lines.map((line) => ({
    sku: line.sku,
    qty: line.qty,
    paid: line.lineSubtotal - perLine,
  }));
  return { orderId, lines: captured, shippingPaid: shipping };
}

module.exports = { captureOrder };
