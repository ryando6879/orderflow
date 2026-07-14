// Decides which warehouse(s) an order ships from, given what each
// warehouse has in stock and where the customer is.

const { WAREHOUSES, TRANSIT_DAYS } = require("./warehouses");

/**
 * Allocate an order's lines to warehouse shipments.
 *
 * Contract: an order must ship as a SINGLE shipment whenever any one
 * warehouse stocks EVERY line in the requested quantity; when more than
 * one warehouse qualifies, choose the one with the FEWEST transit
 * business days to the destination region (see TRANSIT_DAYS in
 * warehouses.js). Only when no single warehouse can fulfil the whole
 * order may it split into per-line shipments. Unnecessary splits cost
 * real money and produce slower delivery promises, so a split is a last
 * resort — never the default.
 *
 * @param {Array<{sku: string, qty: number}>} lines order lines
 * @param {string} destRegion destination region, e.g. "west"
 * @returns {Array<{warehouseId: string, lines: Array<{sku: string, qty: number}>}>}
 */
function allocateOrder(lines, destRegion) {
  const byWarehouse = new Map();
  for (const line of lines) {
    const warehouse = WAREHOUSES.find(
      (candidate) => lines.every((l) => (candidate.stock[l.sku] || 0) >= l.qty)
    );
    if (!byWarehouse.has(warehouse.id)) {
      byWarehouse.set(warehouse.id, []);
    }
    byWarehouse.get(warehouse.id).push(line);
  }
  return [...byWarehouse.entries()].map(([warehouseId, shipmentLines]) => ({
    warehouseId,
    lines: shipmentLines,
  }));
}

module.exports = { allocateOrder };
