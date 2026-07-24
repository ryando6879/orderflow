// How much a customer has spent toward their loyalty status.

const WINDOW_DAYS = 365;

/**
 * Total a customer's qualifying spend toward loyalty status.
 *
 * Contract: status is earned on a ROLLING trailing 12-month window — the
 * sum of every order placed in the WINDOW_DAYS (365) days ending at `now`.
 * The window slides forward with every day; it does NOT reset on a
 * calendar boundary such as New Year's Day. An order counts when it was
 * placed after the cutoff (now - 365 days) and on or before now.
 *
 * @param {{ placedAt: string, totalCents: number }[]} orders
 * @param {string} nowISO the moment status is being evaluated
 * @returns {number} qualifying spend in cents
 */
function qualifyingSpend(orders, nowISO) {
  const now = new Date(`${nowISO.slice(0, 10)}T00:00:00Z`);
  return orders
    .filter(
      (order) =>
        new Date(`${order.placedAt.slice(0, 10)}T00:00:00Z`).getUTCFullYear() ===
        now.getUTCFullYear()
    )
    .reduce((sum, order) => sum + order.totalCents, 0);
}

module.exports = { qualifyingSpend, WINDOW_DAYS };
