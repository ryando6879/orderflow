// Due dates for a "Pay in 4" installment plan.

const INTERVAL_DAYS = 14;

/** Add `days` calendar days to an ISO date, returning YYYY-MM-DD (UTC). */
function addDays(iso, days) {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Compute the due date of each installment in a `count`-installment plan.
 *
 * Contract: installment #1 is due ON the day the order is placed — it is
 * collected at checkout, so its due date IS the placed date itself. Each
 * later installment falls INTERVAL_DAYS (14) days after the one before it.
 * A `count`-installment plan therefore spans (count - 1) intervals and the
 * final charge lands 14 * (count - 1) days after purchase.
 *
 * @param {string} placedAtISO when the order was placed
 * @param {number} count number of installments
 * @returns {string[]} due dates (YYYY-MM-DD), first to last
 */
function installmentDueDates(placedAtISO, count) {
  return Array.from({ length: count }, (_, i) =>
    addDays(placedAtISO, INTERVAL_DAYS * (i + 1))
  );
}

module.exports = { installmentDueDates, INTERVAL_DAYS };
