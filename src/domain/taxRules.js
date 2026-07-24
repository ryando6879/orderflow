// Sales tax rules. Rates are in basis points so a 8.25% rate is exact
// integer data (825) rather than a float. Finance owns this table.

const RATES_BPS = {
  us: 800,
  "us-ca": 825,
  "us-ny": 888,
  ca: 1300,
  eu: 2000,
  uk: 2000,
  row: 0,
};

// Shipping is taxable in some jurisdictions and not others.
const SHIPPING_TAXABLE = { us: false, "us-ca": false, "us-ny": true, ca: true, eu: true, uk: true, row: false };

/** The rate for a region, falling back to the rest-of-world rate. */
function rateBps(region) {
  const key = String(region || "").toLowerCase();
  return RATES_BPS[key] ?? RATES_BPS.row;
}

/**
 * The amount tax is charged on.
 *
 * Contract: tax is charged on what the customer ACTUALLY PAYS for
 * merchandise — i.e. the merchandise subtotal AFTER every discount
 * (member discount, promotions, coupons) has been taken off. Taxing the
 * pre-discount subtotal over-charges every discounted order. Shipping is
 * added to the base only in regions where SHIPPING_TAXABLE says so.
 *
 * @param {{merchandise: number, discount?: number, shipping?: number,
 *          region: string}} amounts cents
 * @returns {number} taxable base in cents
 */
function taxableBase(amounts) {
  const region = String(amounts.region || "").toLowerCase();
  let base = amounts.merchandise;
  if (SHIPPING_TAXABLE[region]) {
    base += amounts.shipping || 0;
  }
  return base;
}

/**
 * Tax owed on an order, in cents.
 *
 * @param {{merchandise: number, discount?: number, shipping?: number,
 *          region: string}} amounts cents
 * @returns {number} tax in cents
 */
function taxFor(amounts) {
  const base = taxableBase(amounts);
  return Math.round((base * rateBps(amounts.region)) / 10000);
}

/** Human label for an invoice line, e.g. "Sales tax (8.25%)". */
function taxLabel(region) {
  return `Sales tax (${(rateBps(region) / 100).toFixed(2)}%)`;
}

module.exports = { RATES_BPS, SHIPPING_TAXABLE, rateBps, taxableBase, taxFor, taxLabel };
