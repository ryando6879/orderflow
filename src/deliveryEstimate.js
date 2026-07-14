// Builds the delivery promise a customer sees at checkout: which
// warehouse each shipment leaves from, when it leaves, and the single
// "arrives by" date for the whole order.

const { allocateOrder } = require("./allocation");
const { dispatchDate } = require("./dispatch");
const { addBusinessDays } = require("./businessDays");
const { getWarehouse, TRANSIT_DAYS } = require("./warehouses");

/**
 * The delivery promise for an order.
 *
 * Policy: each shipment's delivery date is its dispatch date advanced by
 * the transit business days from its warehouse's region to the
 * destination region; the order-level promise shown to the customer is
 * the LATEST shipment's delivery date. Because dispatch and transit are
 * both business-day based, a promise must never fall on a weekend.
 *
 * @param {{placedAt: string, destRegion: string, lines: Array<{sku: string, qty: number}>}} order
 * @returns {{shipments: Array<{warehouseId: string, lines: Array, dispatchDate: string, deliveryDate: string}>, promiseDate: string}}
 */
function deliveryPromise(order) {
  const shipments = allocateOrder(order.lines, order.destRegion).map(
    (shipment) => {
      const warehouse = getWarehouse(shipment.warehouseId);
      const dispatch = dispatchDate(order.placedAt, warehouse);
      const transit = TRANSIT_DAYS[warehouse.region][order.destRegion];
      return {
        ...shipment,
        dispatchDate: dispatch,
        deliveryDate: addBusinessDays(dispatch, transit),
      };
    }
  );
  const promiseDate = shipments
    .map((shipment) => shipment.deliveryDate)
    .sort()
    .pop();
  return { shipments, promiseDate };
}

module.exports = { deliveryPromise };
