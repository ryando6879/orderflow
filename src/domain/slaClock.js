const { addDays, isBusinessDay } = require("../businessDays");

// Fulfillment SLAs. Ops promises a customer a dispatch date and a
// delivery date; this module turns "3 business days" into a real calendar
// date and decides whether a shipment breached its promise.
//
// Carriers do not run on weekends, and they do not run on the observed
// holidays below either — a promise date may never land on one.
const HOLIDAYS = new Set([
  "2026-01-01",
  "2026-05-25",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
  "2027-01-01",
]);

const SLA_DAYS = { standard: 5, express: 2, overnight: 1 };

/**
 * Whether carriers move freight on this date.
 *
 * Contract: a shipping day is a weekday that is ALSO not an observed
 * holiday. Both conditions matter.
 *
 * @param {string} iso ISO date (YYYY-MM-DD)
 */
function isShippingDay(iso) {
  return isBusinessDay(iso) && !HOLIDAYS.has(iso);
}

/**
 * The date a shipment is promised by.
 *
 * Contract: advance `fromIso` by `days` SHIPPING days — weekends and
 * observed holidays are both skipped, and the returned date is itself
 * always a shipping day. A promise date that lands on a holiday is a
 * promise the carrier cannot keep.
 *
 * @param {string} fromIso ISO date the clock starts (usually order date)
 * @param {number} days SLA in shipping days
 * @returns {string} ISO date
 */
function slaDueDate(fromIso, days) {
  let cursor = fromIso;
  let advanced = 0;
  while (advanced < days) {
    cursor = addDays(cursor, 1);
    if (isShippingDay(cursor)) {
      advanced += 1;
    }
  }
  return cursor;
}

/**
 * The promise for an order, from its service level.
 *
 * @param {string} orderedIso ISO date
 * @param {string} service one of SLA_DAYS
 */
function promiseFor(orderedIso, service) {
  const days = SLA_DAYS[service];
  if (days === undefined) {
    throw new Error(`unknown service level: ${service}`);
  }
  return slaDueDate(orderedIso, days);
}

/** Whether a shipment missed its promise date. */
function isBreached(dueIso, deliveredIso) {
  return deliveredIso > dueIso;
}

module.exports = { HOLIDAYS, SLA_DAYS, isShippingDay, slaDueDate, promiseFor, isBreached };
