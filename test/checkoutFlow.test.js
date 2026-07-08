import { describe, it, expect } from "vitest";
import { confirmOrder } from "../src/checkoutFlow.js";

describe("checkout confirmation", () => {
  it("returns a receipt with the charged amount", () => {
    const order = {
      lines: [{ sku: "MUG-1", qty: 1, unitPrice: 1200 }],
      region: "us",
    };
    const receipt = confirmOrder("ORD-1", order);
    expect(receipt.orderId).toBe("ORD-1");
    expect(receipt.chargedTotal).toBeGreaterThan(0);
  });
});
