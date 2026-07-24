// Date helpers. Everything the service stores is UTC — the storefront
// renders in the shopper's local zone, but promise dates, SLA clocks and
// billing periods are all computed here in UTC so two servers in two
// regions agree.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO-8601 string into a Date. Throws on an unparseable value. */
function parseIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Not an ISO-8601 timestamp: ${value}`);
  }
  return date;
}

/** ISO-8601 string, always with a trailing Z. */
function formatIso(date) {
  return parseIso(date).toISOString();
}

/** Midnight UTC on the same calendar day. */
function startOfDayUtc(date) {
  const d = parseIso(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** `date` shifted by whole days. Negative values move backwards. */
function addDays(date, days) {
  return new Date(parseIso(date).getTime() + days * MS_PER_DAY);
}

/** Whole days from `from` to `to`, ignoring the time of day. */
function daysBetween(from, to) {
  return Math.round((startOfDayUtc(to) - startOfDayUtc(from)) / MS_PER_DAY);
}

/** Saturday or Sunday, in UTC. */
function isWeekend(date) {
  const day = parseIso(date).getUTCDay();
  return day === 0 || day === 6;
}

/** Days in the calendar month `date` falls in. */
function daysInMonth(date) {
  const d = parseIso(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

module.exports = {
  MS_PER_DAY,
  parseIso,
  formatIso,
  startOfDayUtc,
  addDays,
  daysBetween,
  isWeekend,
  daysInMonth,
};
