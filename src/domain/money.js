// Money is ALWAYS integer cents inside this service. Floats are only ever
// produced at the very edge, for display. Every helper here takes and
// returns cents.

const CURRENCY_SYMBOLS = { usd: "$", cad: "CA$", eur: "€", gbp: "£" };

/** Sum a list of cent amounts. */
function sumCents(amounts) {
  return amounts.reduce((total, amount) => total + amount, 0);
}

/** `percent` of `cents`, rounded to the nearest cent. */
function applyPercent(cents, percent) {
  return Math.round(cents * (percent / 100));
}

/** `cents` with `percent` taken off, rounded to the nearest cent. */
function discountBy(cents, percent) {
  return cents - applyPercent(cents, percent);
}

/**
 * Render cents for display, e.g. 1234 -> "$12.34".
 *
 * @param {number} cents
 * @param {string} [currency]
 */
function formatCents(cents, currency = "usd") {
  const symbol = CURRENCY_SYMBOLS[currency] || "";
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${symbol}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

/**
 * Split `total` cents across `weights` in proportion to each weight.
 *
 * Contract: the returned parts sum to EXACTLY `total`. Proportional
 * rounding leaves a remainder of a few cents; those remainder cents are
 * handed out one each to the largest weights first, so no cent is ever
 * created or lost. This is what keeps an order-level discount, a payout
 * split, and a partial refund from being a cent off.
 *
 * @param {number} total cents to distribute
 * @param {number[]} weights relative weights (e.g. line subtotals)
 * @returns {number[]} one part per weight, summing to `total`
 */
function allocate(total, weights) {
  const weightTotal = sumCents(weights);
  if (weightTotal === 0) return weights.map(() => 0);
  return weights.map((weight) => Math.floor((weight / weightTotal) * total));
}

/** Split `total` into `parts` near-equal amounts that sum to `total`. */
function splitEvenly(total, parts) {
  return allocate(total, new Array(parts).fill(1));
}

module.exports = {
  sumCents,
  applyPercent,
  discountBy,
  formatCents,
  allocate,
  splitEvenly,
  CURRENCY_SYMBOLS,
};
