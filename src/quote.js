const { shippingCost } = require("./shipping");

// Sales tax applied to merchandise (never to shipping), in percent.
const TAX_PCT = 8;

/**
 * Price a quote for an order: tax-inclusive merchandise plus shipping.
 *
 * Quotes are displayed tax-inclusive, so each line's unit price is taxed
 * before totalling. Pricing a quote is read-only: the order is NOT
 * modified, and quoting is repeatable — the cart page, the checkout
 * review, and the final charge all price the same order object and must
 * produce the same total.
 *
 * @param {{lines: Array<{sku: string, qty: number, unitPrice: number}>,
 *          region: string}} order cart lines with pre-tax unit prices,
 *        in cents
 * @returns {{merchandise: number, shipping: number, total: number}} cents
 */
function priceQuote(order) {
  let merchandise = 0;
  for (const line of order.lines) {
    const taxedPrice = Math.round(line.unitPrice * (1 + TAX_PCT / 100));
    merchandise += taxedPrice * line.qty;
  }
  const itemCount = order.lines.reduce((n, l) => n + l.qty, 0);
  const shipping = shippingCost(order.region, itemCount);
  return { merchandise, shipping, total: merchandise + shipping };
}

module.exports = { priceQuote };
