const { getProduct } = require("../catalog");
const store = require("../db/store");
const { filterBy } = require("../db/query");

// Products live in the catalog module (the merchandising team edits that
// file); per-warehouse stock lives in the store. This repository is the
// join of the two, so callers never have to know that.

const STOCK_TABLE = "stock";

/** Catalog record for a SKU. Throws on an unknown SKU. */
function bySku(sku) {
  return { sku, ...getProduct(sku) };
}

/** Catalog record, or undefined instead of throwing. */
function findBySku(sku) {
  try {
    return bySku(sku);
  } catch {
    return undefined;
  }
}

/** Stock rows for a SKU across every warehouse. */
function stockFor(sku) {
  return filterBy(store.all(STOCK_TABLE), { sku });
}

/** Stock row for one SKU in one warehouse. */
function stockAt(sku, warehouseId) {
  return store.get(STOCK_TABLE, `${warehouseId}:${sku}`);
}

/** Insert or replace a stock row. */
function putStock({ sku, warehouseId, onHand, reserved = 0 }) {
  return store.put(STOCK_TABLE, { id: `${warehouseId}:${sku}`, sku, warehouseId, onHand, reserved });
}

/** Apply a patch to a stock row. */
function updateStock(sku, warehouseId, changes) {
  return store.patch(STOCK_TABLE, `${warehouseId}:${sku}`, changes);
}

/** Every stock row, for the ops dashboard. */
function allStock() {
  return store.all(STOCK_TABLE);
}

module.exports = { bySku, findBySku, stockFor, stockAt, putStock, updateStock, allStock };
