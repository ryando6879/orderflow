const { weightOf, knownSignals, REVIEW_AT, BLOCK_AT } = require("../domain/riskSignals");
const { logger } = require("../lib/logger");

// Checkout fraud screening. Support gets pinged whenever a real customer
// is caught by this, so the trust signals matter as much as the risk
// signals: a long-standing customer ordering to the same address they
// always use should come out well below the review band even when a
// couple of risk signals fire.

/**
 * Score an order's risk signals.
 *
 * Contract: the score is the SUM of every signal's weight. Risk signals
 * carry positive weights and push the score up; TRUST signals carry
 * NEGATIVE weights and pull it back down (see riskSignals.js). Both kinds
 * count — dropping the trust signals is what turns a repeat customer's
 * rush order into a declined one. The score is clamped to 0..100.
 *
 * @param {string[]} signals signal names present on the order
 * @returns {number} 0..100
 */
function score(signals) {
  const total = signals
    .reduce((sum, signal) => sum + weightOf(signal), 0);
  return Math.max(0, Math.min(100, total));
}

/**
 * What checkout should do with an order.
 *
 * @param {string[]} signals
 * @returns {{score: number, decision: "allow"|"review"|"block", signals: string[]}}
 */
function decide(signals) {
  const value = score(signals);
  let decision = "allow";
  if (value >= BLOCK_AT) {
    decision = "block";
  } else if (value >= REVIEW_AT) {
    decision = "review";
  }
  if (decision !== "allow") {
    logger.warn("order flagged by fraud screening", { score: value, decision, signals });
  }
  return { score: value, decision, signals };
}

/** Signals we do not recognise — used to catch typos in callers. */
function unknownSignals(signals) {
  const known = new Set(knownSignals());
  return signals.filter((signal) => !known.has(signal));
}

module.exports = { score, decide, unknownSignals };

if (require.main === module) {
  // A five-year customer re-ordering to their usual address, with rush
  // shipping on a high-value cart.
  console.log(
    "loyal customer, rush order:",
    decide([
      "repeat_customer_in_good_standing",
      "address_matches_previous_order",
      "account_older_than_year",
      "first_order_high_value",
      "rush_shipping_on_first_order",
    ])
  );
}
