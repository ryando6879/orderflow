const productRepo = require("../repositories/productRepo");
const { availableUnits, canReserve, reserve, release, ship, purchasableUnits } = require("../domain/inventory");
const { logger } = require("../lib/logger");

// Stock operations across the warehouse network. The domain module owns
// the arithmetic; this service owns which warehouse a claim comes from
// and the persistence.

/** Total units a shopper may buy of a SKU, across all warehouses. */
function availableForSku(sku) {
  return purchasableUnits(productRepo.stockFor(sku));
}

/** Per-warehouse availability, for the ops dashboard. */
function availabilityBreakdown(sku) {
  return productRepo.stockFor(sku).map((row) => ({
    warehouseId: row.warehouseId,
    onHand: row.onHand,
    reserved: row.reserved || 0,
    available: availableUnits(row),
  }));
}

/** Whether every line of a cart can be fulfilled right now. */
function canFulfilCart(items) {
  return items.every((item) => availableForSku(item.sku) >= item.qty);
}

/**
 * Claim `qty` units of a SKU. Picks the warehouse with the most units
 * available so the network drains evenly, and throws `out_of_stock` when
 * no single warehouse can cover the line.
 *
 * @param {string} sku
 * @param {number} qty
 * @returns {{warehouseId: string, sku: string, qty: number}} the claim
 */
function reserveUnits(sku, qty) {
  const candidates = productRepo
    .stockFor(sku)
    .filter((row) => canReserve(row, qty))
    .sort((a, b) => availableUnits(b) - availableUnits(a));
  const target = candidates[0];
  if (!target) {
    const err = new Error(`insufficient stock for ${sku}: wanted ${qty}, available ${availableForSku(sku)}`);
    err.code = "out_of_stock";
    err.statusCode = 409;
    throw err;
  }
  const updated = reserve(target, qty);
  productRepo.updateStock(sku, target.warehouseId, { reserved: updated.reserved });
  logger.info("stock reserved", { sku, qty, warehouseId: target.warehouseId });
  return { warehouseId: target.warehouseId, sku, qty };
}

/** Reserve every line of a cart, rolling back the whole claim on failure. */
function reserveCart(items) {
  const claims = [];
  try {
    for (const item of items) {
      claims.push(reserveUnits(item.sku, item.qty));
    }
    return claims;
  } catch (err) {
    logger.warn("cart reservation rolled back", { error: err.message, claims: claims.length });
    claims.forEach((claim) => releaseUnits(claim.sku, claim.warehouseId, claim.qty));
    throw err;
  }
}

/** Give reserved units back. */
function releaseUnits(sku, warehouseId, qty) {
  const row = productRepo.stockAt(sku, warehouseId);
  if (!row) return undefined;
  const updated = release(row, qty);
  return productRepo.updateStock(sku, warehouseId, { reserved: updated.reserved });
}

/** Units leave the building: drop both onHand and reserved. */
function shipUnits(sku, warehouseId, qty) {
  const row = productRepo.stockAt(sku, warehouseId);
  if (!row) {
    const err = new Error(`no stock row for ${sku} at ${warehouseId}`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  const updated = ship(row, qty);
  return productRepo.updateStock(sku, warehouseId, { onHand: updated.onHand, reserved: updated.reserved });
}

module.exports = {
  availableForSku,
  availabilityBreakdown,
  canFulfilCart,
  reserveUnits,
  reserveCart,
  releaseUnits,
  shipUnits,
};
