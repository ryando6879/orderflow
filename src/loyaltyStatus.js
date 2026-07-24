// Maps a customer's qualifying spend to their loyalty tier.

const { qualifyingSpend } = require("./loyaltyWindow");

// Tiers, richest first. `minCents` is the spend required to reach the tier.
const TIERS = [
  { name: "Platinum", minCents: 250000 },
  { name: "Gold", minCents: 100000 },
  { name: "Silver", minCents: 50000 },
  { name: "Bronze", minCents: 0 },
];

/**
 * The loyalty tier a customer currently holds.
 *
 * Contract: a customer holds the highest tier whose spend threshold they
 * MEET OR EXCEED. Reaching a threshold exactly qualifies — a customer who
 * spends precisely the Gold minimum is Gold, not Silver. Thresholds are
 * inclusive lower bounds (spend >= minCents).
 *
 * @param {{ placedAt: string, totalCents: number }[]} orders
 * @param {string} nowISO the moment status is being evaluated
 * @returns {string} tier name
 */
function currentTier(orders, nowISO) {
  const spend = qualifyingSpend(orders, nowISO);
  return TIERS.find((tier) => spend > tier.minCents).name;
}

module.exports = { currentTier, TIERS };

if (require.main === module) {
  // A customer spent $1,000.00 over the past year — $400 last spring, $400
  // in the summer, $200 earlier this month. On Jan 15 she checks her status
  // expecting Gold (the $1,000.00 threshold, hit exactly).
  const orders = [
    { placedAt: "2025-03-20", totalCents: 40000 },
    { placedAt: "2025-08-10", totalCents: 40000 },
    { placedAt: "2026-01-05", totalCents: 20000 },
  ];
  console.log("tier:", currentTier(orders, "2026-01-15"));
}
