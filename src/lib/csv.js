// CSV writer for the finance and ops exports (see reportingService.js).
// Finance opens these in Excel, so the output is RFC-4180: CRLF row
// endings, and any cell containing a comma, a quote or a newline is
// wrapped in quotes with inner quotes doubled.

const ROW_SEPARATOR = "\r\n";

/**
 * Render one cell.
 *
 * Contract: EMPTY cells are normal — a `null` or `undefined` value (an
 * order with no coupon, a shipment with no tracking number yet) renders
 * as the empty string rather than the text "null". Numbers and booleans
 * render with their plain string form.
 *
 * @param {unknown} value
 * @returns {string}
 */
function renderCell(value) {
  const needsQuoting = value.includes(",") || value.includes('"') || value.includes("\n");
  if (!needsQuoting) return String(value);
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * Render a full CSV document.
 *
 * @param {string[]} columns header row, in order
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string}
 */
function toCsv(columns, rows) {
  const lines = [columns.map(renderCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => renderCell(row[column])).join(","));
  }
  return lines.join(ROW_SEPARATOR) + ROW_SEPARATOR;
}

module.exports = { renderCell, toCsv, ROW_SEPARATOR };
