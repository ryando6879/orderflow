import { describe, it, expect } from "vitest";
import { saveCart, loadCart } from "../src/savedCart.js";

describe("savedCart - first-time shopper persistence", () => {
  it("persists cart for a first-time shopper who has never saved before", () => {
    // Reproduce the reported symptom: customer adds items yesterday (first visit),
    // logs in today with same account, but cart is empty.
    // Root cause: saveCart only persists when store.has(customerId) is true,
    // so first-time shoppers' carts are never saved.
    
    const store = new Map();
    const customerId = "cust-301";
    const cartLines = [
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 },
    ];
    
    // Day 1: first-time shopper adds items and cart is saved
    const savedCount = saveCart(store, customerId, cartLines);
    expect(savedCount).toBe(2);
    
    // Day 2: customer logs in again and cart should be restored
    const restored = loadCart(store, customerId);
    expect(restored).toEqual([
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 },
    ]);
    expect(restored.length).toBe(2);
  });
  
  it("overwrites previous cart when customer saves again", () => {
    const store = new Map();
    const customerId = "cust-301";
    
    // First save
    saveCart(store, customerId, [
      { sku: "TEE-1", qty: 2 },
    ]);
    
    // Second save with different items
    saveCart(store, customerId, [
      { sku: "MUG-1", qty: 1 },
      { sku: "HAT-1", qty: 1 },
    ]);
    
    const restored = loadCart(store, customerId);
    expect(restored).toEqual([
      { sku: "MUG-1", qty: 1 },
      { sku: "HAT-1", qty: 1 },
    ]);
    expect(restored.length).toBe(2);
  });
});
