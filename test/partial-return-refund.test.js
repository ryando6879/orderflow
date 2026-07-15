import { describe, it, expect } from "vitest";
import { refundAmount } from "../src/refunds.js";
import { processReturn } from "../src/returns.js";

describe("partial return refund calculation", () => {
  it("refunds the returned units' share when returning 2 of 3 items from a line", () => {
    // Gold member ordered 3 tee shirts with member discount + promo code applied.
    // The capture record shows what was actually paid for the line after all discounts.
    // Returning 2 of the 3 shirts should refund 2/3 of the paid amount.
    const record = {
      lines: [
        { sku: "TEE-1", qty: 3, paid: 2700 } // 3 shirts, paid $27 total after discounts
      ],
      shippingPaid: 900
    };
    
    const returnedItems = [{ sku: "TEE-1", qty: 2 }];
    
    // Returning 2 of 3 shirts should refund (2700 / 3) * 2 = 1800 cents
    expect(refundAmount(record, returnedItems)).toBe(1800);
  });

  it("refunds merchandise correctly through processReturn for partial return", () => {
    // Same scenario through the full return flow
    const record = {
      lines: [
        { sku: "TEE-1", qty: 3, paid: 2700 },
        { sku: "HAT-1", qty: 1, paid: 1200 }
      ],
      shippingPaid: 900
    };
    
    const returnedItems = [{ sku: "TEE-1", qty: 2 }];
    
    const result = processReturn(record, returnedItems);
    
    // Should refund 2/3 of the tee line = 1800 cents
    expect(result.merchandise).toBe(1800);
    // Shipping should not be refunded (partial return)
    expect(result.shipping).toBe(0);
    expect(result.total).toBe(1800);
  });

  it("refunds all returned units correctly when returning 1 of 2 items", () => {
    const record = {
      lines: [{ sku: "MUG-1", qty: 2, paid: 1800 }]
    };
    
    const returnedItems = [{ sku: "MUG-1", qty: 1 }];
    
    // Returning 1 of 2 should refund (1800 / 2) * 1 = 900 cents
    expect(refundAmount(record, returnedItems)).toBe(900);
  });
});
