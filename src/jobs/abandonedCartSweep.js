const cartRepo = require("../repositories/cartRepo");
const customerRepo = require("../repositories/customerRepo");
const notificationService = require("../services/notificationService");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// The "you left something in your cart" nudge. Marketing owns the copy;
// we own who gets it and when.
//
// Getting this wrong is expensive in trust: a shopper who is STILL
// SHOPPING must never receive it. That is what the quiet period is for.

/**
 * Whether a cart has gone quiet long enough to nudge.
 *
 * Contract: a cart is abandoned when it has been UNTOUCHED since the
 * cutoff — its last update is at or BEFORE `cutoffIso`. A cart updated
 * after the cutoff is an active shopping session: the shopper is on the
 * site right now, and emailing them mid-session is exactly the mistake
 * this check exists to prevent.
 *
 * @param {{updatedAt: string}} cart
 * @param {string} cutoffIso quiet-period boundary
 * @returns {boolean}
 */
function isAbandoned(cart, cutoffIso) {
  return cart.updatedAt <= cutoffIso;
}

/** The quiet-period boundary for a run. */
function cutoffFor(nowMs = Date.now()) {
  return new Date(nowMs - config.jobs.abandonedCartAfterMinutes * 60_000).toISOString();
}

/**
 * One sweep: nudge every abandoned cart that has not been nudged yet.
 *
 * @param {{nowMs?: number}} [options]
 * @returns {Promise<{considered: number, nudged: number, skipped: number}>}
 */
async function run(options = {}) {
  const cutoff = cutoffFor(options.nowMs);
  const open = cartRepo.openCarts();
  let nudged = 0;
  let skipped = 0;

  for (const cart of open) {
    if (!isAbandoned(cart, cutoff)) {
      skipped += 1;
      continue;
    }
    if (cart.nudgedAt) {
      skipped += 1;
      continue;
    }
    const customer = cart.customerId ? customerRepo.byId(cart.customerId) : undefined;
    if (!customer) {
      skipped += 1;
      continue;
    }
    try {
      await notificationService.sendAbandonedCartNudge(customer, cart);
      cartRepo.update(cart.id, { nudgedAt: new Date().toISOString() });
      nudged += 1;
    } catch (err) {
      logger.error("abandoned-cart nudge failed", { cartId: cart.id, error: err.message });
      skipped += 1;
    }
  }

  return { considered: open.length, nudged, skipped };
}

module.exports = { run, isAbandoned, cutoffFor };
