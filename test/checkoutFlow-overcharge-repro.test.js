import { describe, it, expect } from "vitest";
import { confirmOrder } from "../src/checkoutFlow.js";

describe("checkout confirmation overcharge bug", () => {
  it("charges the same total shown on the review page when priceQuote is called twice", () => {
    // Customer order that triggers the double-taxation bug:
    // priceQuote mutates order.lines[].unitPrice in place, so the second
    // call applies 8% tax to already-taxed prices, compounding to 1.08².
    const order = {
      lines: [
        { sku: "TEE-1", qty: 2, unitPrice: 1900 },
        { sku: "MUG-1", qty: 1, unitPrice: 1200 },
      ],
      region: "us",
    };

    const receipt = confirmOrder("ORD-2041", order);

    // The review page and the final charge must show the same total.
    // When priceQuote is read-only (does not mutate order), both calls
    // produce identical results.
    expect(receipt.chargedTotal).toBe(receipt.reviewTotal);

    // Additionally verify the correct total matches the expected calculation:
    // TEE-1: 1900 * 1.08 = 2052 per unit, qty 2 = 4104
    // MUG-1: 1200 * 1.08 = 1296 per unit, qty 1 = 1296
    // merchandise = 4104 + 1296 = 5400
    // shipping (us, 3 items) = 500 base + 3 * 100 = 800
    // total = 5400 + 800 = 6200 cents
    expect(receipt.reviewTotal).toBe(6200);
    expect(receipt.chargedTotal).toBe(6200);
  });
});
