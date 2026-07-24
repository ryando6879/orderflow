const subscriptionRepo = require("../repositories/subscriptionRepo");
const subscriptionService = require("../services/subscriptionService");
const { logger } = require("../lib/logger");

// Renewal batch. Subscriptions whose period has ended get charged for the
// next one; a failure hands the subscription to the dunning run rather
// than cancelling it here.

/**
 * Renew every subscription whose period ended at or before `nowIso`.
 *
 * @param {{nowIso?: string}} [options]
 * @returns {Promise<{considered: number, renewed: number, failed: number}>}
 */
async function run(options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();
  const due = subscriptionRepo.dueForRenewal(nowIso);
  let renewed = 0;
  let failed = 0;

  for (const subscription of due) {
    try {
      const result = await subscriptionService.renew(subscription, subscription.paymentMethodId || "pm_on_file");
      if (result.status === "past_due") {
        failed += 1;
      } else {
        renewed += 1;
      }
    } catch (err) {
      logger.error("renewal threw", { subscriptionId: subscription.id, error: err.message });
      failed += 1;
    }
  }

  return { considered: due.length, renewed, failed };
}

module.exports = { run };
