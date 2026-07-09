import { describe, it, expect } from "vitest";
import { cartBadgeText } from "../src/cartBadge.js";

describe("cart badge", () => {
  it("shows an empty cart", () => {
    expect(cartBadgeText([])).toBe("0 items");
  });

  it("pluralizes a single item", () => {
    expect(cartBadgeText([{ sku: "TEE-1", qty: 1 }])).toBe("1 item");
  });

  it("counts each product in the cart", () => {
    expect(
      cartBadgeText([
        { sku: "TEE-1", qty: 1 },
        { sku: "MUG-1", qty: 1 },
      ])
    ).toBe("2 items");
  });
});
