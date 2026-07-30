// Stock accounting. Every SKU/warehouse pair carries two numbers:
//   onHand   — units physically on the shelf, only changed by a receipt
//              or a shipment leaving the building
//   reserved — units already promised to carts and unshipped orders
//
// Reservations are what stop two shoppers from buying the last unit.

/**
 * Units a new order may claim.
 *
 * Contract: available = onHand MINUS reserved. Units already promised to
 * another shopper's cart or to an unshipped order are NOT available, even
 * though they are still physically on the shelf — counting them twice is
 * how a warehouse oversells the last unit of a SKU.
 *
 * @param {{onHand: number, reserved?: number}} record
 * @returns {number} units available to promise (never negative)
 */
function availableUnits(record) {
  return Math.max(0, record.onHand - (record.reserved || 0));
}

/**
 * Whether `qty` units can be promised right now.
 *
 * @param {{onHand: number, reserved?: number}} record
 * @param {number} qty
 */
function canReserve(record, qty) {
  return qty > 0 && availableUnits(record) >= qty;
}

/**
 * Promise `qty` units. Returns the updated record; throws when the units
 * are not there, so callers can surface "out of stock" instead of
 * silently overselling.
 *
 * @param {{sku: string, onHand: number, reserved?: number}} record
 * @param {number} qty
 */
function reserve(record, qty) {
  if (!canReserve(record, qty)) {
    const err = new Error(`insufficient stock for ${record.sku}: wanted ${qty}, available ${availableUnits(record)}`);
    err.code = "out_of_stock";
    err.statusCode = 409;
    throw err;
  }
  return { ...record, reserved: (record.reserved || 0) + qty };
}

/** Give `qty` reserved units back (cart abandoned, order cancelled). */
function release(record, qty) {
  return { ...record, reserved: Math.max(0, (record.reserved || 0) - qty) };
}

/** Ship `qty` units: they leave the shelf and stop being reserved. */
function ship(record, qty) {
  return {
    ...record,
    onHand: Math.max(0, record.onHand - qty),
    reserved: Math.max(0, (record.reserved || 0) - qty),
  };
}

/** Storefront stock label input: how many units a shopper may add. */
function purchasableUnits(records) {
  return records.reduce((total, record) => total + availableUnits(record), 0);
}

module.exports = { availableUnits, canReserve, reserve, release, ship, purchasableUnits };
