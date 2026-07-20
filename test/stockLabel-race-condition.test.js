import { describe, it, expect } from "vitest";
import { stockLabel } from "../src/stockLabel.js";

describe("stockLabel race condition", () => {
  it("shows 'Out of stock' when all units are reserved by pending orders", () => {
    // Flash-sale item: 4 units on the shelf, all 4 already reserved by pending
    // orders (the exact scenario from the inline example at stockLabel.js:29-32).
    // The product page must read "Out of stock" because no units are actually
    // promisable to new shoppers.
    const hotItem = { sku: "MUG-1", onHand: 4, reserved: 4 };
    expect(stockLabel(hotItem)).toBe("Out of stock");
  });

  it("shows 'Only N left' when some units remain after subtracting reservations", () => {
    // 5 units on hand, 2 already reserved: only 3 are promisable.
    // Should display "Only 3 left" (within LOW_STOCK_THRESHOLD of 5).
    const product = { sku: "MUG-1", onHand: 5, reserved: 2 };
    expect(stockLabel(product)).toBe("Only 3 left");
  });

  it("shows 'In stock' when available units exceed the low stock threshold", () => {
    // 10 units on hand, 3 reserved: 7 are promisable.
    // Should display "In stock" (7 > LOW_STOCK_THRESHOLD of 5).
    const product = { sku: "TEE-1", onHand: 10, reserved: 3 };
    expect(stockLabel(product)).toBe("In stock");
  });

  it("shows 'Out of stock' when reservations exceed on-hand inventory", () => {
    // Edge case: 3 units on hand but 5 reserved (oversold situation).
    // Must show "Out of stock" because available = 3 - 5 = -2 <= 0.
    const oversold = { sku: "HAT-1", onHand: 3, reserved: 5 };
    expect(stockLabel(oversold)).toBe("Out of stock");
  });
});
