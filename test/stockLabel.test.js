import { describe, it, expect } from "vitest";
import { stockLabel } from "../src/stockLabel.js";

describe("stock label", () => {
  it("shows plentiful items as in stock", () => {
    expect(stockLabel({ sku: "TEE-1", onHand: 20, reserved: 0 })).toBe(
      "In stock"
    );
  });

  it("warns when only a few units remain", () => {
    expect(stockLabel({ sku: "HAT-1", onHand: 3, reserved: 0 })).toBe(
      "Only 3 left"
    );
  });

  it("shows an empty shelf as out of stock", () => {
    expect(stockLabel({ sku: "STK-1", onHand: 0, reserved: 0 })).toBe(
      "Out of stock"
    );
  });
});
