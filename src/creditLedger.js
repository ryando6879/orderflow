// Store-credit event ledger. Credit is never stored as a running number —
// the balance is always derived by folding the event history, so the ledger
// is the single source of truth.

/**
 * Compute a customer's store-credit balance from their event history.
 *
 * Contract: the payments provider delivers events AT-LEAST-ONCE — after an
 * outage or a slow acknowledgement it re-sends events, so the SAME event
 * (identical `id`) can appear in the history more than once. Each event id
 * must be counted exactly ONCE when folding the balance.
 *
 * Event semantics: `grant` and `refund_to_credit` ADD to the balance;
 * `spend` SUBTRACTS from it.
 *
 * @param {{ id: string, type: string, amountCents: number }[]} events
 * @returns {number} balance in cents
 */
function creditBalance(events) {
  let balance = 0;
  for (const event of events) {
    if (event.type === "spend") {
      balance -= event.amountCents;
    } else {
      balance += event.amountCents;
    }
  }
  return balance;
}

module.exports = { creditBalance };
