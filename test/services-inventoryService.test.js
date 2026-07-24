import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { putStock, stockAt } from "../src/repositories/productRepo.js";
import {
  availableForSku,
  availabilityBreakdown,
  canFulfilCart,
  reserveUnits,
  releaseUnits,
  shipUnits,
} from "../src/services/inventoryService.js";

describe("inventoryService", () => {
  beforeEach(() => {
    resetStore();
    putStock({ sku: "TEE-1", warehouseId: "east-1", onHand: 10, reserved: 0 });
    putStock({ sku: "TEE-1", warehouseId: "west-1", onHand: 4, reserved: 0 });
    putStock({ sku: "HAT-1", warehouseId: "east-1", onHand: 0, reserved: 0 });
  });

  it("sums availability across the network", () => {
    expect(availableForSku("TEE-1")).toBe(14);
    expect(availableForSku("HAT-1")).toBe(0);
  });

  it("breaks availability out per warehouse", () => {
    const rows = availabilityBreakdown("TEE-1");
    expect(rows.length).toBe(2);
    expect(rows.find((row) => row.warehouseId === "west-1").available).toBe(4);
  });

  it("says whether a cart can be fulfilled", () => {
    expect(canFulfilCart([{ sku: "TEE-1", qty: 3 }])).toBe(true);
    expect(canFulfilCart([{ sku: "HAT-1", qty: 1 }])).toBe(false);
  });

  it("claims units from the fullest warehouse", () => {
    const claim = reserveUnits("TEE-1", 3);
    expect(claim.warehouseId).toBe("east-1");
    expect(stockAt("TEE-1", "east-1").reserved).toBe(3);
  });

  it("refuses a claim nothing can cover", () => {
    try {
      reserveUnits("HAT-1", 1);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err.code).toBe("out_of_stock");
    }
  });

  it("gives units back", () => {
    reserveUnits("TEE-1", 3);
    releaseUnits("TEE-1", "east-1", 3);
    expect(stockAt("TEE-1", "east-1").reserved).toBe(0);
  });

  it("takes units off the shelf when they ship", () => {
    const row = shipUnits("TEE-1", "east-1", 2);
    expect(row.onHand).toBe(8);
  });

  it("throws when shipping from a warehouse with no such row", () => {
    try {
      shipUnits("MUG-1", "east-1", 1);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });
});
