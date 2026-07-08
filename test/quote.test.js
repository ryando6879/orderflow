import { describe, it, expect } from "vitest";
import { priceQuote } from "../src/quote.js";

describe("quote pricing", () => {
  it("prices a tax-inclusive quote with shipping", () => {
    const order = {
      lines: [{ sku: "TEE-1", qty: 2, unitPrice: 1900 }],
      region: "us",
    };
    const quote = priceQuote(order);
    expect(quote.merchandise).toBe(4104); // 1900 * 1.08 = 2052 per unit
    expect(quote.shipping).toBe(700); // us: 500 base + 2 * 100
    expect(quote.total).toBe(4804);
  });

  it("rounds the taxed unit price to whole cents", () => {
    const order = {
      lines: [{ sku: "STK-1", qty: 1, unitPrice: 600 }],
      region: "us",
    };
    expect(priceQuote(order).merchandise).toBe(648);
  });
});
