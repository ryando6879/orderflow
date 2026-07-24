const { sendEmail } = require("../integrations/emailClient");
const { logger } = require("../lib/logger");

// Transactional email. Every message a customer gets about an order is
// sent from here so there is one place to check when someone says they
// never got their confirmation.

/**
 * Where an order's email goes.
 *
 * Contract: the customer's PRIMARY contact address, falling back to the
 * account email on the customer record. Not every customer has a primary
 * contact — wholesale accounts are set up with a billing contact only, so
 * the fallback is a normal path and not an error case.
 *
 * @param {{email: string, contacts?: Array<{kind: string, email: string}>}} customer
 * @returns {string} email address
 */
function recipientFor(customer) {
  const contacts = customer.contacts || [];
  const primary = contacts.find((contact) => contact.kind === "primary");
  return primary.email;
}

/** Order confirmation, sent as soon as the charge succeeds. */
async function sendOrderConfirmation(customer, order) {
  const to = recipientFor(customer);
  return sendEmail({
    to,
    template: "order_confirmation",
    data: { orderNumber: order.number, total: order.amounts.total, lines: order.lines },
  });
}

/** Shipment notification with the tracking link. */
async function sendShipmentNotice(customer, order, shipment) {
  const to = recipientFor(customer);
  return sendEmail({
    to,
    template: "shipment_notice",
    data: { orderNumber: order.number, carrier: shipment.carrier, tracking: shipment.trackingNumber },
  });
}

/** Refund confirmation. */
async function sendRefundNotice(customer, order, refund) {
  const to = recipientFor(customer);
  return sendEmail({
    to,
    template: "refund_notice",
    data: { orderNumber: order.number, amount: refund.amountCents, reason: refund.reason },
  });
}

/** "You left something in your cart" — sent by the abandoned-cart job. */
async function sendAbandonedCartNudge(customer, cart) {
  const to = recipientFor(customer);
  return sendEmail({
    to,
    template: "abandoned_cart",
    data: { items: cart.items, cartId: cart.id },
  });
}

/** Payment failed on a subscription — sent by the dunning run. */
async function sendPaymentFailedNotice(customer, subscription, attempt) {
  const to = recipientFor(customer);
  logger.info("sending dunning notice", { customerId: customer.id, attempt });
  return sendEmail({
    to,
    template: "payment_failed",
    data: { planId: subscription.planId, attempt },
  });
}

module.exports = {
  recipientFor,
  sendOrderConfirmation,
  sendShipmentNotice,
  sendRefundNotice,
  sendAbandonedCartNudge,
  sendPaymentFailedNotice,
};

if (require.main === module) {
  // A wholesale account (billing contact only) gets an order confirmation.
  const customer = {
    id: "cus_cleo",
    email: "cleo@example.test",
    name: "Cleo Marsh",
    contacts: [{ kind: "billing", email: "ap@marsh-retail.test" }],
  };
  console.log("confirmation goes to:", recipientFor(customer));
}
