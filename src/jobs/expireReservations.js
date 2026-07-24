const cartRepo = require("../repositories/cartRepo");
const inventoryService = require("../services/inventoryService");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// Stock reserved for a cart that never checked out has to come back, or
// the storefront slowly shows everything as out of stock.
//
// Only carts that never converted hold reservations; a converted cart's
// units belong to its order until the order ships or is cancelled.

/** The reservation cutoff for a run. */
function cutoffFor(nowMs = Date.now()) {
  return new Date(nowMs - config.jobs.reservationTtlMinutes * 60_000).toISOString();
}

/**
 * Release stock held by carts that went quiet before the cutoff.
 *
 * @param {{nowMs?: number}} [options]
 * @returns {Promise<{considered: number, released: number}>}
 */
async function run(options = {}) {
  const cutoff = cutoffFor(options.nowMs);
  const stale = cartRepo.openCarts().filter((cart) => cart.updatedAt <= cutoff && cart.reservations?.length);
  let released = 0;

  for (const cart of stale) {
    for (const claim of cart.reservations) {
      try {
        inventoryService.releaseUnits(claim.sku, claim.warehouseId, claim.qty);
        released += 1;
      } catch (err) {
        logger.error("failed to release reservation", {
          cartId: cart.id,
          sku: claim.sku,
          error: err.message,
        });
      }
    }
    cartRepo.update(cart.id, { reservations: [] });
  }

  return { considered: stale.length, released };
}

module.exports = { run, cutoffFor };
