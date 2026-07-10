// Membership plans for OrderFlow Plus: free shipping, early access to
// drops, and member pricing on the storefront. Billed once per period.

/**
 * Plan catalog. `priceCents` is the price of ONE FULL billing period,
 * in cents — proration math elsewhere splits it by days.
 */
const PLANS = {
  basic: { id: "basic", name: "Basic", priceCents: 1200 },
  pro: { id: "pro", name: "Pro", priceCents: 3600 },
  team: { id: "team", name: "Team", priceCents: 9000 },
};

/**
 * Look up a plan by id.
 *
 * @param {string} id
 * @returns {{id: string, name: string, priceCents: number}}
 */
function getPlan(id) {
  const plan = PLANS[id];
  if (!plan) {
    throw new Error(`unknown plan: ${id}`);
  }
  return plan;
}

module.exports = { PLANS, getPlan };
