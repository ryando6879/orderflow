// Mid-cycle plan changes for OrderFlow Plus memberships. Builds the
// prorated invoice lines for switching plans partway through a period.

const { getPlan } = require("./plans");
const { periodInfo } = require("./billingPeriod");
const { unusedCredit, remainderCharge } = require("./proration");

/**
 * Build the invoice lines for a mid-period plan change.
 *
 * Contract: exactly two lines — a positive charge for the remainder of
 * the period on the new plan, then a negative credit for the unused
 * time already paid on the old plan. Amounts are pre-tax cents; the
 * invoice module owns tax.
 *
 * @param {{planId: string, periodStart: string, periodEnd: string}} subscription
 * @param {string} newPlanId
 * @param {string} changeDate ISO date the switch takes effect
 * @returns {Array<{description: string, amountCents: number}>}
 */
function planChangeLines(subscription, newPlanId, changeDate) {
  const oldPlan = getPlan(subscription.planId);
  const newPlan = getPlan(newPlanId);
  const period = periodInfo(
    subscription.periodStart,
    subscription.periodEnd,
    changeDate
  );
  return [
    {
      description: `${newPlan.name} plan for the rest of the period`,
      amountCents: remainderCharge(newPlan, period),
    },
    {
      description: `Credit for unused time on ${oldPlan.name}`,
      amountCents: -unusedCredit(oldPlan, period),
    },
  ];
}

module.exports = { planChangeLines };
