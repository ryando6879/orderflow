// Assembles the "Pay in 4" plan a shopper sees at checkout: the per-
// installment schedule plus the amount charged to their card right now.

const { splitInstallments } = require("./installments");
const { installmentDueDates } = require("./installmentSchedule");

/**
 * Build the installment plan shown at checkout.
 *
 * Returns one entry per installment ({ amountCents, dueDate }) plus
 * `dueTodayCents`, the amount the customer's card is charged immediately.
 *
 * Contract: `dueTodayCents` is the FIRST installment's amount — the exact
 * number the customer also sees as installment #1 in the schedule. It must
 * be read from the computed installment amounts, never recomputed on its
 * own, so the "due today" figure and the schedule can never disagree: they
 * must reconcile to the penny.
 *
 * @param {{ placedAt: string, totalCents: number }} order
 * @param {number} [count=4]
 * @returns {{ installments: {amountCents: number, dueDate: string}[], dueTodayCents: number }}
 */
function buildInstallmentPlan(order, count = 4) {
  const amounts = splitInstallments(order.totalCents, count);
  const dueDates = installmentDueDates(order.placedAt, count);
  const installments = amounts.map((amountCents, i) => ({
    amountCents,
    dueDate: dueDates[i],
  }));
  const dueTodayCents = Math.round(order.totalCents / count);
  return { installments, dueTodayCents };
}

module.exports = { buildInstallmentPlan };

if (require.main === module) {
  // A shopper checks out a $59.99 order and picks "Pay in 4". She expects
  // her four charges to add back up to $59.99, the first one to hit her
  // card today, and the rest every two weeks.
  const order = { placedAt: "2026-03-06", totalCents: 5999 };
  const plan = buildInstallmentPlan(order, 4);

  const sum = plan.installments.reduce((total, x) => total + x.amountCents, 0);
  console.log(`plan total: ${sum} (order total: ${order.totalCents})`);
  console.log(`due today: ${plan.dueTodayCents}`);
  plan.installments.forEach((x, i) =>
    console.log(`  #${i + 1}: ${x.amountCents}c due ${x.dueDate}`)
  );
}
