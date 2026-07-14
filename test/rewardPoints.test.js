import { describe, it, expect } from "vitest";
import { rewardPointsForOrder } from "../src/rewardPoints.js";

describe("reward points", () => {
  it("awards one point per dollar of subtotal on a free-shipping order", () => {
    expect(rewardPointsForOrder({ subtotal: 5000, shipping: 0 })).toBe(50);
  });

  it("rounds a partial dollar down", () => {
    expect(rewardPointsForOrder({ subtotal: 12345, shipping: 0 })).toBe(123);
  });

  it("earns nothing on an empty order", () => {
    expect(rewardPointsForOrder({ subtotal: 0, shipping: 0 })).toBe(0);
  });
});
