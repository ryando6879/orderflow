// Tracking view-model for the order tracking page. Turns an order's event
// history into the list of journey steps and the progress the page renders.

const { STATUS_ORDER, currentStatus } = require("./orderStatus");

const STEP_LABELS = {
  placed: "Order placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * View-model for the tracking page.
 *
 * Contract: `steps` mirrors STATUS_ORDER; each step's `state` is "done" for
 * steps the order has passed, "current" for the step it is on, and "todo" for
 * the rest. `percent` is how far along the journey is: the current step's
 * index over the LAST index (STATUS_ORDER.length - 1), times 100 and rounded —
 * so a freshly placed order reads 0 and a delivered order reads exactly 100.
 *
 * @param {{ events: { status: string, at: string }[] }} order
 * @returns {{ steps: { key: string, label: string, state: string }[], percent: number }}
 */
function trackingModel(order) {
  const status = currentStatus(order);
  const idx = STATUS_ORDER.indexOf(status);
  const steps = STATUS_ORDER.map((key, i) => ({
    key,
    label: STEP_LABELS[key],
    state: i < idx ? "done" : i === idx ? "current" : "todo",
  }));
  const percent = Math.round((idx / STATUS_ORDER.length) * 100);
  return { steps, percent };
}

module.exports = { trackingModel };
