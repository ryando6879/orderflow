import { describe, it, expect } from "vitest";
import { lineTotal, cartTotal } from "../src/cart.js";

describe("cart", () => {
  it("applies the sale discount to a discounted item", () => {
    expect(lineTotal({ sku: "MUG-1", qty: 1 })).toBe(1080);
  });

  it("multiplies the discounted unit price by quantity", () => {
    expect(lineTotal({ sku: "HAT-1", qty: 2 })).toBe(4080);
  });

  it("sums line totals across the cart", () => {
    expect(
      cartTotal([
        { sku: "MUG-1", qty: 2 },
        { sku: "HAT-1", qty: 1 },
      ])
    ).toBe(2160 + 2040);
  });
});
