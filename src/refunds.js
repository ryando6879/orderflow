/**
 * Merchandise refunds, settled from an order's capture record (the
 * record built by captureOrder in payment.js). Only the record is
 * available here — tier and promotion context do not survive checkout,
 * so refunds must come from the recorded paid amounts.
 */

/**
 * Merchandise refund, in cents, for returning items from an order.
 *
 * The customer gets back exactly what they paid for the returned units:
 * a line's per-unit refund is its recorded paid amount divided by the
 * line quantity, and a partial return refunds precisely the returned
 * units' share of the line. Shipping is never included here (see
 * returns.js for the shipping rule).
 *
 * @param {{lines: Array<{sku: string, qty: number, paid: number}>}} record
 *        the capture record for the order
 * @param {Array<{sku: string, qty: number}>} returnedItems
 * @returns {number} refund in cents
 */
function refundAmount(record, returnedItems) {
  let refund = 0;
  for (const item of returnedItems) {
    const line = record.lines.find((l) => l.sku === item.sku);
    if (!line) continue;
    const qty = Math.min(item.qty, line.qty);
    if (qty === line.qty) {
      refund += line.paid;
    } else {
      refund += Math.round((line.paid / line.qty) * qty);
    }
  }
  return refund;
}

module.exports = { refundAmount };
