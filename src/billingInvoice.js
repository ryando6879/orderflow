// Invoice totalling for membership billing. An invoice is a list of
// lines in pre-tax cents; credits are negative lines.

// Sales tax applied to membership charges, in percent.
const TAX_PCT = 8;

/**
 * Total an invoice, in cents.
 *
 * Contract: tax applies to the NET subtotal — credit lines reduce the
 * taxable base before tax is computed, exactly like a discount does.
 * The customer can never be taxed on money that is being given back:
 * `tax = round(net subtotal × 8%)` and `total = net subtotal + tax`.
 *
 * @param {Array<{description: string, amountCents: number}>} lines
 * @returns {{subtotal: number, tax: number, total: number}} cents;
 *          `subtotal` is the net of charges and credits, pre-tax
 */
function invoiceSummary(lines) {
  const charges = lines
    .filter((line) => line.amountCents > 0)
    .reduce((sum, line) => sum + line.amountCents, 0);
  const credits = lines
    .filter((line) => line.amountCents < 0)
    .reduce((sum, line) => sum + line.amountCents, 0);
  const tax = Math.round((charges + credits) * (TAX_PCT / 100));
  return { subtotal: charges + credits, tax, total: charges + credits + tax };
}

module.exports = { invoiceSummary, TAX_PCT };
