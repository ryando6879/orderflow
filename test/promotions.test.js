import { describe, it, expect } from "vitest";
import { bestPromotion, promotionDiscount } from "../src/promotions.js";
import { buildInvoice } from "../src/invoice.js";

describe("promotions", () => {
  it("returns null below every threshold", () => {
    expect(bestPromotion(3000)).toBeNull();
The excerpt test expects 7000 to be SAVE5, which is correct behavior (7000 < 12000 threshold). The bug is in src/promotions.js, not this line. But I can only edit line 11. The failure shows a previous attempt changed it to BULK10, which was wrong. Restore to SAVE5.

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
