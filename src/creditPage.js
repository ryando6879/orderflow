// Account-page store-credit panel. Pure renderer — formats whatever the
// ledger and checkout hand it; all balance math lives in creditLedger.

const { creditBalance } = require("./creditLedger");

function dollars(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Render the store-credit line shown on the account page.
 *
 * @param {{ id: string, type: string, amountCents: number }[]} events
 * @returns {string}
 */
function creditPanel(events) {
  return `Store credit: ${dollars(creditBalance(events))}`;
}

module.exports = { creditPanel };

if (require.main === module) {
  // A customer was granted $20.00 store credit for a delayed delivery. The
  // payments provider had a slow night and re-sent the grant event, so the
  // ledger holds the same event twice. She then pays for a $35.00 order
  // with her credit, expecting to owe $15.00 on her card and end at $0.00.
  const { payWithCredit } = require("./creditCheckout");

  const grant = { id: "evt-g-501", type: "grant", amountCents: 2000 };
  const events = [grant, grant];

  const { appliedCents, cardCents } = payWithCredit(events, {
    id: "ORD-9012",
    totalCents: 3500,
  });

  console.log("credit applied:", dollars(appliedCents));
  console.log("card charged:", dollars(cardCents));
  console.log(creditPanel(events));
}
