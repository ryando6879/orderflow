// The delivery panel on the checkout page: one row per shipment plus the
// "Arrives by" promise row the customer sees before paying.

const { deliveryPromise } = require("./deliveryEstimate");

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO date for the panel, e.g. "2026-03-10" → "Tue, Mar 10". */
function prettyDate(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]}, ${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Render the delivery panel for an order: one row per shipment, then the
 * order-level "Arrives by" row.
 *
 * @param {{placedAt: string, destRegion: string, lines: Array<{sku: string, qty: number}>}} order
 * @returns {string[]} panel rows, top to bottom
 */
function renderDeliveryPanel(order) {
  const { shipments, promiseDate } = deliveryPromise(order);
  const rows = shipments.map(
    (shipment, index) =>
      `Shipment ${index + 1} from ${shipment.warehouseId}: leaves ${prettyDate(
        shipment.dispatchDate
      )}, arrives ${prettyDate(shipment.deliveryDate)}`
  );
  rows.push(`Arrives by ${prettyDate(promiseDate)}`);
  return rows;
}

module.exports = { renderDeliveryPanel, prettyDate };

if (require.main === module) {
  // A west-coast customer orders on a Friday afternoon. Everything she
  // bought is in stock at the west-coast warehouse.
  const order = {
    placedAt: "2026-03-06T16:30:00Z",
    destRegion: "west",
    lines: [
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 },
      { sku: "HAT-1", qty: 1 },
    ],
  };
  for (const row of renderDeliveryPanel(order)) {
    console.log(row);
  }
}
