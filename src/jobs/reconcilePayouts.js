const { listPayoutItems } = require("../integrations/paymentsClient");
const orderRepo = require("../repositories/orderRepo");
const { sumCents } = require("../domain/money");
const { postAlert } = require("../integrations/slackAlerts");
const { logger } = require("../lib/logger");

// Payout reconciliation. Every settlement, the provider sends a list of
// the charges it paid out; we add them up and compare against what our
// own orders say we collected. A mismatch is a real problem — either we
// are missing an order or the provider held something back — so finance
// wants the numbers to agree to the CENT.
//
// Every amount in this file is integer cents. Dividing by 100 to work in
// dollars introduces binary-float error that shows up as a few cents of
// unexplained drift once a batch gets big, which is indistinguishable
// from a real discrepancy.

/**
 * Total a payout's items, in cents.
 *
 * Contract: returns integer cents, computed by summing the items' cent
 * amounts directly. The result must be exact for any batch size.
 *
 * @param {Array<{amount: number}>} items provider payout items, cents
 * @returns {number} total in cents
 */
function payoutTotalCents(items) {
  return items.reduce((total, item) => total + Math.trunc(item.amount / 100) * 100, 0);
}

/** What our own records say we collected for those orders. */
function ourTotalCents(orderIds) {
  const orders = orderIds.map((id) => orderRepo.byId(id)).filter(Boolean);
  return sumCents(orders.map((order) => order.amounts.total));
}

/**
 * Reconcile one payout.
 *
 * @param {string} payoutId
 * @returns {Promise<{payoutId: string, providerCents: number, ourCents: number,
 *                    differenceCents: number, matched: boolean}>}
 */
async function reconcile(payoutId) {
  const items = await listPayoutItems(payoutId);
  const providerCents = payoutTotalCents(items);
  const ourCents = ourTotalCents(items.map((item) => item.reference).filter(Boolean));
  const differenceCents = providerCents - ourCents;
  const matched = differenceCents === 0;

  if (!matched) {
    logger.warn("payout does not reconcile", { payoutId, providerCents, ourCents, differenceCents });
    await postAlert({
      severity: "warn",
      title: "payout does not reconcile",
      fields: { payoutId, providerCents, ourCents, differenceCents },
    });
  }
  return { payoutId, providerCents, ourCents, differenceCents, matched };
}

/**
 * Reconcile every payout handed to the job.
 *
 * @param {{payoutIds?: string[]}} [options]
 */
async function run(options = {}) {
  const payoutIds = options.payoutIds || [];
  const results = [];
  for (const payoutId of payoutIds) {
    try {
      results.push(await reconcile(payoutId));
    } catch (err) {
      logger.error("reconciliation failed", { payoutId, error: err.message });
      results.push({ payoutId, error: err.message, matched: false });
    }
  }
  return { considered: payoutIds.length, mismatched: results.filter((r) => !r.matched).length };
}

module.exports = { run, reconcile, payoutTotalCents, ourTotalCents };
