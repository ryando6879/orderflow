import { describe, it, expect } from "vitest";
import { freeShippingStatus } from "../src/freeShipping.js";

describe("free shipping banner", () => {
  it("tells the customer how much more they need", () => {
    const status = freeShippingStatus([{ sku: "TEE-1", qty: 1 }]); // $19.00
    expect(status.unlocked).toBe(false);
    expect(status.remaining).toBe(3100);
    expect(status.message).toBe("You're $31.00 away from free shipping");
  });

  it("unlocks once the cart reaches the threshold", () => {
    const status = freeShippingStatus([{ sku: "TEE-1", qty: 3 }]); // $57.00
    expect(status.unlocked).toBe(true);
    expect(status.remaining).toBe(0);
    expect(status.message).toBe("You've unlocked free shipping!");
  });

  it("treats exactly $50 as unlocked", () => {
    const status = freeShippingStatus([
      { sku: "TEE-1", qty: 2 }, // $38.00
      { sku: "STK-1", qty: 2 }, // $12.00
    ]);
    expect(status.unlocked).toBe(true);
    expect(status.remaining).toBe(0);
  });
});
