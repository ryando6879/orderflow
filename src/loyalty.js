// Loyalty program tiers. Members earn a percentage discount on the
// merchandise subtotal (never on shipping). Tier assignment is by
// lifetime spend, in cents.
const TIERS = [
  { name: "gold", minSpend: 100000, discountPct: 10 },
  { name: "silver", minSpend: 25000, discountPct: 5 },
  { name: "bronze", minSpend: 0, discountPct: 0 },
];

/**
 * Resolve a member's loyalty tier from their lifetime spend.
 *
 * @param {{lifetimeSpend?: number}} member
 * @returns {{name: string, discountPct: number}} the tier name plus the
 *          member discount percentage that tier grants on the merchandise
 *          subtotal, e.g. { name: "gold", discountPct: 10 }
 */
function memberTier(member) {
  const spend = member.lifetimeSpend ?? 0;
  const tier = TIERS.find((t) => spend >= t.minSpend);
  return { name: tier.name, discountPct: tier.discountPct };
}

module.exports = { memberTier };
