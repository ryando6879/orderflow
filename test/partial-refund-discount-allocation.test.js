import { describe, it, expect } from "vitest";
import { captureOrder } from "../src/payment.js";
import { refundAmount } from "../src/refunds.js";
import { buildInvoice } from "../src/invoice.js";

describe("partial refund with order-level discounts", () => {
  it("refunds the correct proportional amount when returning part of a discounted order", () => {
    // Gold member ordered three tee shirts and a hat, used a promo code on top of member discount
    // Later sent back two of the three shirts
    // Finance calculated the correct refund for two shirts should be $32.30
    
    const lines = [
      { sku: "TEE-1", qty: 3, lineSubtotal: 5700 }, // 3 shirts at $19 each
      { sku: "HAT-1", qty: 1, lineSubtotal: 2500 }, // 1 hat at $25
    ];
    const subtotal = 8200; // $82.00
    const shipping = 700;
    
    // Gold member: 10% discount on subtotal = $8.20 = 820 cents
    // Promo SAVE5: 5% off subtotal (pre-member-discount) = $4.10 = 410 cents
    const invoice = buildInvoice({ subtotal, shipping }, { lifetimeSpend: 150000 });
    
    // Capture the order with the discounts
    const record = captureOrder("ORD-123", lines, invoice, shipping);
    
    // Return 2 of the 3 shirts
    const returnedItems = [{ sku: "TEE-1", qty: 2 }];
    
    // Calculate refund
    const refund = refundAmount(record, returnedItems);
    
    // Finance says the correct refund for 2 shirts is $32.30 = 3230 cents
    expect(refund).toBe(3230);
  });
});
