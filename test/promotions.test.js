import { describe, it, expect } from "vitest";
import { bestPromotion, promotionDiscount } from "../src/promotions.js";
import { buildInvoice } from "../src/invoice.js";

describe("promotions", () => {
  it("returns null below every threshold", () => {
    expect(bestPromotion(3000)).toBeNull();
  });

  it("applies SAVE5 to mid-size orders", () => {
    expect(bestPromotion(7000).code).toBe("SAVE5");
  });

  it("computes the discount from the percentage", () => {
    expect(promotionDiscount(7000, { percentOff: 5 })).toBe(350);
  });
});

describe("invoice with promotions", () => {
  it("stacks a promotion on a guest order", () => {
    const invoice = buildInvoice({ subtotal: 8000, shipping: 500 }, {});
    expect(invoice.tier).toBe("bronze");
    expect(invoice.promo).toBe("SAVE5");
    expect(invoice.promoDiscount).toBe(400);
    expect(invoice.total).toBe(8100);
  });
});
