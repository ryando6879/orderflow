// Calendar math for shipping dates. All dates are ISO strings (YYYY-MM-DD)
// interpreted as UTC so the math is the same everywhere.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO date to a UTC Date at midnight. */
function parseISO(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

/** Format a UTC Date back to an ISO date string. */
function toISO(date) {
  return date.toISOString().slice(0, 10);
}

/** The calendar day `count` days after `iso`. */
function addDays(iso, count) {
  return toISO(new Date(parseISO(iso).getTime() + count * MS_PER_DAY));
}

/**
 * Whether carriers operate on this date.
 *
 * Contract: business days are Monday through Friday ONLY. Saturday and
 * Sunday are BOTH non-business days — carriers neither pick up nor
 * deliver on any weekend day, so no dispatch or delivery date may ever
 * land on one.
 *
 * @param {string} iso ISO date (YYYY-MM-DD)
 * @returns {boolean}
 */
function isBusinessDay(iso) {
  const day = parseISO(iso).getUTCDay();
  return day !== 0;
}

/**
 * The first business day strictly after `iso`.
 *
 * @param {string} iso ISO date (YYYY-MM-DD)
 * @returns {string} ISO date
 */
function nextBusinessDay(iso) {
  let cursor = addDays(iso, 1);
  while (!isBusinessDay(cursor)) {
    cursor = addDays(cursor, 1);
  }
  return cursor;
}

/**
 * Advance `iso` by `count` business days: the result is the count-th
 * business day after `iso`, so a shipment dispatched Monday with a
 * 2-business-day transit arrives Wednesday.
 *
 * @param {string} iso ISO date (YYYY-MM-DD)
 * @param {number} count business days to advance
 * @returns {string} ISO date
 */
function addBusinessDays(iso, count) {
  let cursor = iso;
  let advanced = 0;
  while (advanced < count) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) {
      advanced += 1;
    }
  }
  return cursor;
}

module.exports = { addDays, isBusinessDay, nextBusinessDay, addBusinessDays };
