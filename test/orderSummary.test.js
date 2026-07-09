import { describe, it, expect } from "vitest";
import { summarizeCart } from "../src/orderSummary.js";

describe("order summary", () => {
  it("is empty for an empty cart", () => {
    expect(summarizeCart([])).toEqual([]);
  });

  it("builds a row per product with name, qty and line total", () => {
    const rows = summarizeCart([
      { sku: "TEE-1", qty: 1 },
      { sku: "MUG-1", qty: 2 },
    ]);
    expect(rows).toEqual([
      { sku: "TEE-1", name: "Logo Tee", qty: 1, lineTotal: 1900 },
      { sku: "MUG-1", name: "Coffee Mug", qty: 2, lineTotal: 2160 },
    ]);
  });

  it("keeps products in the order they were added", () => {
    const rows = summarizeCart([
      { sku: "HAT-1", qty: 1 },
      { sku: "STK-1", qty: 1 },
    ]);
    expect(rows.map((r) => r.sku)).toEqual(["HAT-1", "STK-1"]);
  });
});
