import { describe, it, expect } from "vitest";
import { availableUnits, canReserve, reserve, release, ship, purchasableUnits } from "../src/domain/inventory.js";

describe("availability", () => {
  it("reports the units on an untouched shelf", () => {
    expect(availableUnits({ onHand: 5, reserved: 0 })).toBe(5);
  });

  it("never reports a negative number", () => {
    expect(availableUnits({ onHand: 0, reserved: 0 })).toBe(0);
  });

  it("sums availability across warehouses", () => {
    expect(purchasableUnits([{ onHand: 2, reserved: 0 }, { onHand: 3, reserved: 0 }])).toBe(5);
  });
});

describe("reservations", () => {
  it("allows a claim the shelf can cover", () => {
    expect(canReserve({ sku: "TEE-1", onHand: 5, reserved: 0 }, 3)).toBe(true);
  });

  it("refuses a claim of zero units", () => {
    expect(canReserve({ sku: "TEE-1", onHand: 5, reserved: 0 }, 0)).toBe(false);
  });

  it("refuses a claim bigger than the shelf", () => {
    expect(canReserve({ sku: "TEE-1", onHand: 1, reserved: 0 }, 4)).toBe(false);
  });

  it("promises units by adding to reserved", () => {
    expect(reserve({ sku: "TEE-1", onHand: 5, reserved: 0 }, 2).reserved).toBe(2);
  });

  it("throws out_of_stock when the units are not there", () => {
    try {
      reserve({ sku: "HAT-1", onHand: 0, reserved: 0 }, 1);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err.code).toBe("out_of_stock");
      expect(err.statusCode).toBe(409);
    }
  });

  it("gives units back on release", () => {
    expect(release({ sku: "TEE-1", onHand: 5, reserved: 2 }, 1).reserved).toBe(1);
  });

  it("never releases below zero", () => {
    expect(release({ sku: "TEE-1", onHand: 5, reserved: 0 }, 3).reserved).toBe(0);
  });
});

describe("shipping units out", () => {
  it("drops both onHand and reserved", () => {
    const shipped = ship({ sku: "TEE-1", onHand: 5, reserved: 2 }, 2);
    expect(shipped.onHand).toBe(3);
    expect(shipped.reserved).toBe(0);
  });
});
