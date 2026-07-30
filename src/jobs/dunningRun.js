const subscriptionRepo = require("../repositories/subscriptionRepo");
const customerRepo = require("../repositories/customerRepo");
const { createCharge } = require("../integrations/paymentsClient");
const notificationService = require("../services/notificationService");
const { getPlan } = require("../plans");
const { addDays } = require("../lib/dates");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// Dunning: recovering a subscription whose renewal charge failed. Cards
// are re-tried on a fixed schedule, with an email each time, and the
// subscription is only cancelled once the schedule runs out.
//
// The schedule below is the gap in DAYS before each retry: the 1st retry
// is a day after the failure, the 2nd three days after that, and so on.
// Attempt numbers are 1-BASED — `dunningAttempts` counts failures so far,
// so the retry we are scheduling is attempt `dunningAttempts + 1`.
const SCHEDULE_DAYS = [1, 3, 5, 7];

/**
 * When the next collection attempt should happen.
 *
 * Contract: `attempt` is the 1-based number of the retry being scheduled,
 * so attempt 1 waits SCHEDULE_DAYS[0] days, attempt 2 waits
 * SCHEDULE_DAYS[1], and so on. Reading past the end of the schedule
 * yields no date at all, which silently drops the subscription out of
 * dunning instead of cancelling it properly.
 *
 * @param {number} attempt 1-based retry number
 * @param {string} fromIso when the failure happened
 * @returns {string} ISO timestamp of the next attempt
 */
function nextAttemptAt(attempt, fromIso) {
  return addDays(fromIso, SCHEDULE_DAYS[attempt - 1]).toISOString();
}

/** Whether a subscription still has retries left. */
function hasRetriesLeft(subscription) {
  return (subscription.dunningAttempts || 0) < config.jobs.dunningMaxAttempts;
}

/**
 * One dunning pass over every past-due subscription.
 *
 * @param {{nowIso?: string}} [options]
 * @returns {Promise<{considered: number, retried: number, recovered: number, cancelled: number}>}
 */
async function run(options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();
  const pastDue = subscriptionRepo.pastDue();
  let retried = 0;
  let recovered = 0;
  let cancelled = 0;

  for (const subscription of pastDue) {
    if (!hasRetriesLeft(subscription)) {
      subscriptionRepo.update(subscription.id, { status: "canceled", canceledReason: "dunning_exhausted" });
      cancelled += 1;
      continue;
    }
    if (subscription.nextAttemptAt && subscription.nextAttemptAt > nowIso) {
      continue;
    }

    const plan = getPlan(subscription.planId);
    const attempt = (subscription.dunningAttempts || 0) + 1;
    try {
      await createCharge({
        amountCents: plan.priceCents,
        customerId: subscription.customerId,
        paymentMethodId: subscription.paymentMethodId || "pm_on_file",
        idempotencyKey: `${subscription.id}:dunning:${attempt}`,
        description: `OrderFlow Plus ${plan.name} (retry ${attempt})`,
      });
      subscriptionRepo.markPaid(subscription.id, nowIso, addDays(nowIso, 30).toISOString());
      recovered += 1;
    } catch (err) {
      logger.warn("dunning attempt failed", {
        subscriptionId: subscription.id,
        attempt,
        error: err.message,
      });
      const updated = subscriptionRepo.recordDunningAttempt(subscription.id, err.message);
      subscriptionRepo.update(subscription.id, { nextAttemptAt: nextAttemptAt(attempt, nowIso) });
      const customer = customerRepo.byId(subscription.customerId);
      if (customer) {
        await notificationService.sendPaymentFailedNotice(customer, updated, attempt);
      }
      retried += 1;
    }
  }

  return { considered: pastDue.length, retried, recovered, cancelled };
}

module.exports = { run, nextAttemptAt, hasRetriesLeft, SCHEDULE_DAYS };
