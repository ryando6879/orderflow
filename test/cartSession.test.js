import { describe, it, expect } from "vitest";
import { cartFor, addItem, applyCoupon } from "../src/cartSession.js";

describe("cart session", () => {
  it("keeps a shopper's items and coupon through a browsing session", () => {
    const sessions = new Map();

    expect(addItem(sessions, "sess-77", "TEE-1", 2)).toBe(1);
    expect(addItem(sessions, "sess-77", "MUG-1", 1)).toBe(2);
    // Adding the same sku again merges quantity instead of a new line.
    expect(addItem(sessions, "sess-77", "TEE-1", 1)).toBe(2);

    applyCoupon(sessions, "sess-77", "SAVE5");

    const cart = cartFor(sessions, "sess-77");
    expect(cart.items).toEqual([
      { sku: "TEE-1", qty: 3 },
      { sku: "MUG-1", qty: 1 },
    ]);
    expect(cart.couponCode).toBe("SAVE5");
  });
});
