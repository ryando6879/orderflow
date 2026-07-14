// Fulfillment network data: what each warehouse stocks, when its carrier
// pickup cutoff is, and how many BUSINESS days a shipment takes to each
// destination region. Ops maintains this file — it is the source of truth
// for the network, and application code must treat it as read-only.

const WAREHOUSES = [
  {
    id: "east-1",
    region: "east",
    // Last carrier pickup: orders confirmed after this hour (UTC) miss
    // the truck for the day.
    cutoffHour: 15,
    stock: { "TEE-1": 40, "MUG-1": 12, "HAT-1": 0, "STK-1": 60 },
  },
  {
    id: "west-1",
    region: "west",
    cutoffHour: 14,
    stock: { "TEE-1": 25, "MUG-1": 30, "HAT-1": 18, "STK-1": 0 },
  },
];

// Business-day transit times from a warehouse's region to a destination
// region. A west-coast customer waits 4 business days for an east-coast
// shipment but only 1 for a local one.
const TRANSIT_DAYS = {
  east: { east: 1, central: 2, west: 4 },
  west: { east: 4, central: 3, west: 1 },
};

/** Look up a warehouse by id. */
function getWarehouse(id) {
  return WAREHOUSES.find((warehouse) => warehouse.id === id);
}

module.exports = { WAREHOUSES, TRANSIT_DAYS, getWarehouse };
