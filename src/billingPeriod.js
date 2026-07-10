// Billing-period day math for mid-cycle plan changes. A subscription's
// period is a calendar month; when a customer switches plans partway
// through, proration splits the period at the change date.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days from ISO date `a` up to ISO date `b`. */
function diffDays(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / MS_PER_DAY);
}

/**
 * Split a billing period at a plan-change date.
 *
 * Contract: `start` and `end` are BOTH inclusive — a standard March
 * period (2026-03-01 to 2026-03-31) spans 31 days. The change date
 * itself belongs to the NEW plan: `daysUsed` counts only the full days
 * before it. Every day in the period lands on exactly one side, so
 * `daysUsed + daysRemaining` always equals `daysInPeriod`.
 *
 * @param {string} start ISO date, first day of the period (inclusive)
 * @param {string} end ISO date, last day of the period (inclusive)
 * @param {string} changeDate ISO date the customer switches plans
 * @returns {{daysInPeriod: number, daysUsed: number, daysRemaining: number}}
 */
function periodInfo(start, end, changeDate) {
  const daysInPeriod = diffDays(start, end);
  const daysUsed = diffDays(start, changeDate);
  const daysRemaining = daysInPeriod - daysUsed;
  return { daysInPeriod, daysUsed, daysRemaining };
}

module.exports = { periodInfo };
