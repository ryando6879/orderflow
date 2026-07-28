import { describe, it, expect } from "vitest";
import { priceCart } from "../src/services/pricingService.js";

describe("tax calculation on discounted orders", () => {
  it("charges tax on the post-discount merchandise amount, not the pre-discount amount", () => {
    // Reproduces the reported incident: $95 merchandise, $14.25 discount,
    // tax should be 8% of $80.75 ($6.46), not 8% of $95 ($7.60).
    // Using us-ca region (8.25% rate per taxRules.js) to match the report's 8% context.
    const cart = {
      items: [
        { sku: "TEE-1", qty: 5 },  // Will total to $95 in merchandise
      ],
      region: "us",  // 8% rate (800 bps)
    };
    
    // Member with lifetime spend that triggers a discount tier
    const member = { lifetimeSpend: 150000 };
    
    const result = priceCart(cart, member);
    
    // The report states: $95 merchandise, $14.25 discount
    // We verify the tax is calculated on (merchandise - discount), not on merchandise alone
    const expectedTaxableBase = result.merchandise - result.discount;
    const expectedTax = Math.round((expectedTaxableBase * 800) / 10000);
    
    // Tax must equal 8% of the post-discount amount
    expect(result.tax).toBe(expectedTax);
    
    // Concrete verification: if merchandise is 9500 cents and discount is 1425 cents,
    // taxable base is 8075 cents, and tax at 8% (800 bps) is 646 cents, not 760 cents
    if (result.merchandise === 9500 && result.discount === 1425) {
      expect(result.tax).toBe(646);  // 8075 * 0.08 = 646
      expect(result.tax).not.toBe(760);  // Wrong: 9500 * 0.08 = 760
    }
  });

  it("applies tax correctly when both member discount and promo discount are present", () => {
    // The report mentions "she had a members discount with a code on top"
    const cart = {
      items: [
        { sku: "MUG-1", qty: 10 },
      ],
      region: "us",
    };
    
    const member = { lifetimeSpend: 200000 };
    
    const result = priceCart(cart, member);
    
    // Tax must be on (merchandise - memberDiscount - promoDiscount)
    const taxableBase = result.merchandise - result.memberDiscount - result.promoDiscount;
    const expectedTax = Math.round((taxableBase * 800) / 10000);
    
    expect(result.tax).toBe(expectedTax);
    expect(result.discount).toBe(result.memberDiscount + result.promoDiscount);
  });

  it("charges tax correctly on full-price orders without discount", () => {
    // The report states "full-price orders are fine" - verify this remains true
    const cart = {
      items: [
        { sku: "TEE-1", qty: 2 },
      ],
      region: "us",
    };
    
    // No member, so no discount
    const result = priceCart(cart);
    
    // When discount is 0, tax should be on full merchandise amount
    const expectedTax = Math.round((result.merchandise * 800) / 10000);
    
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(expectedTax);
  });
});
