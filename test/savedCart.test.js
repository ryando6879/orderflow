import { describe, it, expect } from "vitest";
import { saveCart, loadCart } from "../src/savedCart.js";

describe("saved cart", () => {
  it("updates a cart the customer saved earlier", () => {
    const store = new Map([["cust-1", [{ sku: "TEE-1", qty: 1 }]]]);
    saveCart(store, "cust-1", [{ sku: "MUG-1", qty: 2 }]);
    expect(loadCart(store, "cust-1")).toEqual([{ sku: "MUG-1", qty: 2 }]);
  });

  it("reports how many lines were saved", () => {
    const store = new Map([["cust-1", []]]);
    const saved = saveCart(store, "cust-1", [
      { sku: "TEE-1", qty: 1 },
      { sku: "HAT-1", qty: 1 },
    ]);
    expect(saved).toBe(2);
  });

  it("returns an empty cart for a customer who never saved one", () => {
    expect(loadCart(new Map(), "cust-9")).toEqual([]);
  });
});
