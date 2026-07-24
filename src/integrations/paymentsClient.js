const { requestJson } = require("./httpClient");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// Payments provider. Charges, refunds and payout reads. Amounts are
// always cents, and every mutating call carries an idempotency key the
// caller supplies so a retry cannot double-charge.

function headers(idempotencyKey) {
  const base = {
    authorization: `Bearer ${config.payments.apiKey}`,
    "of-client": "orderflow",
  };
  return idempotencyKey ? { ...base, "idempotency-key": idempotencyKey } : base;
}

/**
 * Charge a card.
 *
 * @param {{amountCents: number, currency?: string, customerId: string,
 *          paymentMethodId: string, idempotencyKey: string,
 *          description?: string}} charge
 * @returns {Promise<{id: string, status: string, amountCents: number}>}
 */
async function createCharge(charge) {
  logger.info("charging card", {
    customerId: charge.customerId,
    amountCents: charge.amountCents,
  });
  return requestJson({
    method: "POST",
    url: `${config.payments.baseUrl}/v1/charges`,
    headers: headers(charge.idempotencyKey),
    body: {
      amount: charge.amountCents,
      currency: charge.currency || "usd",
      customer: charge.customerId,
      payment_method: charge.paymentMethodId,
      description: charge.description,
    },
  });
}

/**
 * Refund all or part of a charge.
 *
 * @param {{chargeId: string, amountCents: number, reason?: string,
 *          idempotencyKey: string}} refund
 */
async function createRefund(refund) {
  return requestJson({
    method: "POST",
    url: `${config.payments.baseUrl}/v1/refunds`,
    headers: headers(refund.idempotencyKey),
    body: { charge: refund.chargeId, amount: refund.amountCents, reason: refund.reason },
  });
}

/** Read a charge back (dispute handling, reconciliation). */
async function getCharge(chargeId) {
  return requestJson({ url: `${config.payments.baseUrl}/v1/charges/${chargeId}`, headers: headers() });
}

/** The provider's payout report for a settlement date. */
async function listPayoutItems(payoutId) {
  const body = await requestJson({
    url: `${config.payments.baseUrl}/v1/payouts/${payoutId}/items`,
    headers: headers(),
  });
  return body.items || [];
}

module.exports = { createCharge, createRefund, getCharge, listPayoutItems };
