import { describe, it, expect } from "vitest";
import { priceCart } from "../src/services/pricingService.js";

describe("priceCart", () => {
  it("prices a small single-line cart", () => {
    const priced = priceCart({ items: [{ sku: "STK-1", qty: 1 }], region: "us" }, {});
    expect(priced.merchandise).toBe(600);
    expect(priced.discount).toBe(0);
    expect(priced.shipping).toBe(600);
    expect(priced.tax).toBe(48);
    expect(priced.total).toBe(1248);
  });

  it("applies each line's catalog sale price", () => {
    const priced = priceCart({ items: [{ sku: "MUG-1", qty: 2 }], region: "us" }, {});
    // $12.00 mug at 10% off = $10.80 a unit.
    expect(priced.lines).toEqual([{ sku: "MUG-1", qty: 2, subtotal: 2160 }]);
  });

  it("picks the best order promotion for a big cart", () => {
    const priced = priceCart({ items: [{ sku: "TEE-1", qty: 4 }], region: "us" }, {});
    expect(priced.merchandise).toBe(7600);
    expect(priced.promo).toBe("SAVE5");
    expect(priced.promoDiscount).toBe(380);
  });

  it("labels the tax line for the region", () => {
    const priced = priceCart({ items: [{ sku: "STK-1", qty: 1 }], region: "us-ca" }, {});
    expect(priced.taxLabel).toBe("Sales tax (8.25%)");
  });

  it("charges the rest-of-world shipping rate for an unknown region", () => {
    const priced = priceCart({ items: [{ sku: "STK-1", qty: 1 }], region: "apac" }, {});
    expect(priced.shipping).toBe(1650);
  });
});
