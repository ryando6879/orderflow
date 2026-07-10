// Proration for mid-cycle plan changes: credit the unused share of the
// old plan, charge the remaining share of the new plan. Day counts come
// from billingPeriod's periodInfo.

/**
 * Credit for the unused time on the old plan, in cents.
 *
 * Contract: the customer already paid for the whole period up front, so
 * the credit is the UNUSED portion of what they paid — the old plan's
 * price scaled by the share of the period still remaining
 * (daysRemaining / daysInPeriod), rounded to whole cents.
 *
 * @param {{priceCents: number}} oldPlan
 * @param {{daysInPeriod: number, daysUsed: number, daysRemaining: number}} period
 * @returns {number} cents (positive; the caller signs the invoice line)
 */
function unusedCredit(oldPlan, period) {
  return Math.round(oldPlan.priceCents * (period.daysUsed / period.daysInPeriod));
}

/**
 * Charge for the rest of the period on the new plan, in cents.
 *
 * Contract: the new plan's price scaled by the share of the period the
 * customer will spend on it (daysRemaining / daysInPeriod), rounded to
 * whole cents.
 *
 * @param {{priceCents: number}} newPlan
 * @param {{daysInPeriod: number, daysUsed: number, daysRemaining: number}} period
 * @returns {number} cents
 */
function remainderCharge(newPlan, period) {
  return Math.round(newPlan.priceCents * (period.daysRemaining / period.daysInPeriod));
}

module.exports = { unusedCredit, remainderCharge };
