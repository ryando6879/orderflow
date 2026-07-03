import { describe, it, expect } from "vitest";
import { completeCheckout } from "../src/checkout.js";

describe("checkout", () => {
  it("prices the order with shipping", () => {
    const result = completeCheckout([{ sku: "MUG-1", qty: 2 }], "us");
    expect(result.subtotal).toBe(2160);
    expect(result.shipping).toBe(700);
    expect(result.total).toBe(2860);
    expect(result.orderId).toMatch(/^ORD-/);
  });
});
