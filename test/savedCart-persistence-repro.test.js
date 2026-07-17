import { describe, it, expect } from "vitest";
import { saveCart, loadCart } from "../src/savedCart.js";

describe("savedCart persistence bug", () => {
  it("persists cart for first-time shopper (no prior saved cart)", () => {
    // Reproduce the reported symptom: customer adds items yesterday (first visit),
    // logs in today, and cart is empty because saveCart silently failed.
    const store = new Map();
    const customerId = "cust-301";
    const lines = [
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 },
    ];

    // Yesterday: customer adds items and saveCart is called.
    // This is a FIRST-TIME shopper — store does NOT have customerId yet.
    const savedCount = saveCart(store, customerId, lines);

    // saveCart claims it saved 2 lines
    expect(savedCount).toBe(2);

    // Today: customer logs back in and loadCart is called.
    // The cart MUST contain the 2 items saved yesterday.
    const restored = loadCart(store, customerId);

    // Assert the CONCRETE correct behavior: restored cart has 2 lines with the exact items.
    expect(restored).toHaveLength(2);
    expect(restored).toEqual([
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 },
    ]);
  });

  it("overwrites existing saved cart for returning customer", () => {
    // Verify the contract also works for customers who DO have a prior saved cart.
    const store = new Map();
    const customerId = "cust-302";

    // First visit: save initial cart
    saveCart(store, customerId, [{ sku: "HAT-1", qty: 1 }]);

    // Second visit: customer modifies cart and saves again
    saveCart(store, customerId, [
      { sku: "TEE-1", qty: 2 },
      { sku: "STK-1", qty: 3 },
    ]);

    // Load should return the MOST RECENT snapshot, not the first one
    const restored = loadCart(store, customerId);
    expect(restored).toEqual([
      { sku: "TEE-1", qty: 2 },
      { sku: "STK-1", qty: 3 },
    ]);
  });
});
