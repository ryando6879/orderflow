import { describe, it, expect } from "vitest";
import { shippingCost } from "../src/shipping.js";

describe("shipping", () => {
  it("charges the US base plus per-item rate", () => {
    expect(shippingCost("US", 2)).toBe(700);
  });

  it("charges the EU rate", () => {
    expect(shippingCost("eu", 1)).toBe(1050);
  });
});
