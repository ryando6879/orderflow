const { requestJson } = require("./httpClient");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// Transactional email provider. Templates are managed in the provider's
// dashboard; we send a template id plus its data. In development (no API
// key configured) sends are logged instead of delivered.

const TEMPLATES = {
  order_confirmation: "tmpl_order_confirmation_v3",
  shipment_notice: "tmpl_shipment_notice_v2",
  refund_notice: "tmpl_refund_notice_v1",
  abandoned_cart: "tmpl_abandoned_cart_v4",
  payment_failed: "tmpl_payment_failed_v2",
  review_hold: "tmpl_review_hold_v1",
};

/** Resolve a template name to the provider's template id. */
function templateId(name) {
  const id = TEMPLATES[name];
  if (!id) {
    throw new Error(`unknown email template: ${name}`);
  }
  return id;
}

/**
 * Send one transactional email.
 *
 * @param {{to: string, template: string, data?: Record<string, unknown>}} message
 * @returns {Promise<{id: string, queued: boolean}>}
 */
async function sendEmail(message) {
  const template = templateId(message.template);
  if (!config.email.apiKey || config.env === "test") {
    logger.info("email suppressed (no provider configured)", {
      to: message.to,
      template: message.template,
    });
    return { id: `local_${message.template}`, queued: false };
  }
  return requestJson({
    method: "POST",
    url: `${config.email.baseUrl}/v1/messages`,
    headers: { authorization: `Bearer ${config.email.apiKey}` },
    body: {
      from: config.email.fromAddress,
      to: message.to,
      template,
      data: message.data || {},
    },
  });
}

module.exports = { TEMPLATES, templateId, sendEmail };
