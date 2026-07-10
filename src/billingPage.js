// The "Confirm plan change" panel: the line items a member sees before
// confirming a plan switch, and the total the card is charged.

const { planChangeLines } = require("./planChange");
const { invoiceSummary, TAX_PCT } = require("./billingInvoice");

/** Format cents for the panel, e.g. 2400 → "$24.00", -400 → "-$4.00". */
function money(cents) {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

/**
 * Render the confirmation panel for a plan change: one row per invoice
 * line, a tax row, and the "Total due today" row — the exact amount the
 * customer's card is charged when they confirm.
 *
 * @param {{planId: string, periodStart: string, periodEnd: string}} subscription
 * @param {string} newPlanId
 * @param {string} changeDate
 * @returns {string[]} panel rows, top to bottom
 */
function renderPlanChange(subscription, newPlanId, changeDate) {
  const lines = planChangeLines(subscription, newPlanId, changeDate);
  const { tax, total } = invoiceSummary(lines);
  const rows = lines.map(
    (line) => `${line.description}  ${money(line.amountCents)}`
  );
  rows.push(`Tax (${TAX_PCT}%)  ${money(tax)}`);
  rows.push(`Total due today  ${money(total)}`);
  return rows;
}

module.exports = { renderPlanChange };

if (require.main === module) {
  // A Basic member upgrades to Pro a third of the way through March.
  const subscription = {
    planId: "basic",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  };
  for (const row of renderPlanChange(subscription, "pro", "2026-03-11")) {
    console.log(row);
  }
}
