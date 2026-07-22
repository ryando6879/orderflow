// Checkout step that lets a customer pay with store credit first and put
// the remainder on their card.

const { creditBalance } = require("./creditLedger");

/**
 * Pay for an order using available store credit, charging the card for
 * whatever credit doesn't cover.
 *
 * Contract: credit applied = min(balance, order total) — never more than
 * the customer has, never more than the order costs. A `spend` event is
 * recorded for the amount of credit ACTUALLY APPLIED, never the full order
 * total: when credit only covers part of the order the card pays the rest,
 * and only the covered part may leave the credit balance.
 *
 * @param {{ id: string, type: string, amountCents: number }[]} events -
 *   the customer's credit event history; the spend event is appended here
 * @param {{ id: string, totalCents: number }} order
 * @returns {{ appliedCents: number, cardCents: number }}
 */
function payWithCredit(events, order) {
  const balance = creditBalance(events);
  const appliedCents = Math.min(balance, order.totalCents);
  const cardCents = order.totalCents - appliedCents;
  events.push({
    id: `spend-${order.id}`,
    type: "spend",
    amountCents: appliedCents,
  });
  return { appliedCents, cardCents };
}

module.exports = { payWithCredit };
