import { describe, it, expect } from "vitest";
import { rewardPointsForOrder } from "../src/rewardPoints.js";

describe("reward points - shipping fee incident", () => {
  it("excludes shipping fees from points calculation", () => {
    // Customer report: $50.00 of items plus $8.00 shipping was credited 58 points
    // Expected: 50 points (subtotal only, shipping never earns points per contract)
    const order = { subtotal: 5000, shipping: 800 };
    expect(rewardPointsForOrder(order)).toBe(50);
  });

  it("excludes shipping on orders with non-zero shipping cost", () => {
    // Additional case: verify shipping is excluded regardless of amount
    const order = { subtotal: 2500, shipping: 500 };
    expect(rewardPointsForOrder(order)).toBe(25);
  });

  it("handles free shipping correctly (already passing)", () => {
    // Customer mentioned earlier order with free shipping had correct points
    const order = { subtotal: 5000, shipping: 0 };
    expect(rewardPointsForOrder(order)).toBe(50);
  });
});
