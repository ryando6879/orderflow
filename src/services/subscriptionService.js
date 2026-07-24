const subscriptionRepo = require("../repositories/subscriptionRepo");
const customerRepo = require("../repositories/customerRepo");
const { getPlan } = require("../plans");
const { periodInfo } = require("../billingPeriod");
const { unusedCredit, remainderCharge } = require("../proration");
const { createCharge } = require("../integrations/paymentsClient");
const notificationService = require("./notificationService");
const { addDays } = require("../lib/dates");
const { opaqueId } = require("../lib/ids");
const { logger } = require("../lib/logger");

// OrderFlow Plus subscription management: start, change plan, cancel,
// renew. Money math lives in proration.js / billingPeriod.js — this
// service only sequences it and persists the result.

/** Start a subscription on a plan, billing the first full period now. */
async function subscribe({ customerId, planId, paymentMethodId, startIso }) {
  const customer = customerRepo.requireById(customerId);
  const plan = getPlan(planId);
  const existing = subscriptionRepo.activeForCustomer(customerId);
  if (existing) {
    const err = new Error(`customer ${customerId} already has subscription ${existing.id}`);
    err.code = "already_subscribed";
    err.statusCode = 409;
    throw err;
  }

  const start = startIso || new Date().toISOString();
  const subscription = subscriptionRepo.create({
    id: opaqueId("sub"),
    customerId,
    planId: plan.id,
    status: "active",
    currentPeriodStart: start,
    currentPeriodEnd: addDays(start, 30).toISOString(),
  });

  await createCharge({
    amountCents: plan.priceCents,
    customerId,
    paymentMethodId,
    idempotencyKey: `${subscription.id}:initial`,
    description: `OrderFlow Plus ${plan.name}`,
  });
  logger.info("subscription started", { subscriptionId: subscription.id, planId: plan.id });
  return subscription;
}

/**
 * Change plan mid-period: credit the unused part of the old plan and
 * charge the remaining part of the new one.
 *
 * @param {{subscriptionId: string, planId: string, changeIso?: string,
 *          paymentMethodId?: string}} request
 * @returns {Promise<{subscription: object, credit: number, charge: number, net: number}>}
 */
async function changePlan(request) {
  const subscription = subscriptionRepo.byId(request.subscriptionId);
  if (!subscription) {
    const err = new Error(`subscription ${request.subscriptionId} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  const oldPlan = getPlan(subscription.planId);
  const newPlan = getPlan(request.planId);
  const changeIso = request.changeIso || new Date().toISOString();
  const period = periodInfo(
    subscription.currentPeriodStart.slice(0, 10),
    subscription.currentPeriodEnd.slice(0, 10),
    changeIso.slice(0, 10)
  );

  const credit = unusedCredit(oldPlan, period);
  const charge = remainderCharge(newPlan, period);
  const net = charge - credit;

  if (net > 0 && request.paymentMethodId) {
    await createCharge({
      amountCents: net,
      customerId: subscription.customerId,
      paymentMethodId: request.paymentMethodId,
      idempotencyKey: `${subscription.id}:change:${changeIso}`,
      description: `Plan change to ${newPlan.name}`,
    });
  }

  const updated = subscriptionRepo.update(subscription.id, { planId: newPlan.id });
  logger.info("plan changed", { subscriptionId: subscription.id, from: oldPlan.id, to: newPlan.id, net });
  return { subscription: updated, credit, charge, net };
}

/** Cancel at period end (the customer keeps access until then). */
function cancel(subscriptionId) {
  return subscriptionRepo.update(subscriptionId, { cancelAtPeriodEnd: true });
}

/** Renew one subscription: charge the next period, or start dunning. */
async function renew(subscription, paymentMethodId) {
  const plan = getPlan(subscription.planId);
  if (subscription.cancelAtPeriodEnd) {
    return subscriptionRepo.update(subscription.id, { status: "canceled" });
  }
  try {
    await createCharge({
      amountCents: plan.priceCents,
      customerId: subscription.customerId,
      paymentMethodId,
      idempotencyKey: `${subscription.id}:${subscription.currentPeriodEnd}`,
      description: `OrderFlow Plus ${plan.name} renewal`,
    });
  } catch (err) {
    logger.warn("renewal charge failed", { subscriptionId: subscription.id, error: err.message });
    const pastDue = subscriptionRepo.recordDunningAttempt(subscription.id, err.message);
    const customer = customerRepo.byId(subscription.customerId);
    if (customer) {
      await notificationService.sendPaymentFailedNotice(customer, pastDue, pastDue.dunningAttempts);
    }
    return pastDue;
  }
  const start = subscription.currentPeriodEnd;
  return subscriptionRepo.markPaid(subscription.id, start, addDays(start, 30).toISOString());
}

module.exports = { subscribe, changePlan, cancel, renew };
