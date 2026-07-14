// When a shipment actually leaves the warehouse: same day if the order
// beat the carrier pickup cutoff, otherwise it waits for the next truck.

const { addDays, isBusinessDay, nextBusinessDay } = require("./businessDays");

/**
 * The date a shipment leaves the warehouse.
 *
 * Contract: an order placed at or before the warehouse's carrier cutoff
 * hour (UTC) on a business day dispatches THAT day. An order placed
 * after the cutoff — or on a non-business day — dispatches on the NEXT
 * BUSINESS day. A dispatch date must never land on a weekend, because
 * carriers do not pick up on weekends.
 *
 * @param {string} placedAt ISO timestamp the order was placed
 * @param {{cutoffHour: number}} warehouse
 * @returns {string} ISO dispatch date (YYYY-MM-DD)
 */
function dispatchDate(placedAt, warehouse) {
  const day = placedAt.slice(0, 10);
  const placedHour = new Date(placedAt).getUTCHours();
  if (placedHour <= warehouse.cutoffHour && isBusinessDay(day)) {
    return day;
  }
  return nextBusinessDay(day);
}

module.exports = { dispatchDate };
