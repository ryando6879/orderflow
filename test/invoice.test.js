import { describe, it, expect } from "vitest";
import { memberTier } from "../src/loyalty.js";
import { buildInvoice } from "../src/invoice.js";

describe("loyalty", () => {
  it("assigns bronze to new members", () => {
    expect(memberTier({}).name).toBe("bronze");
  });

  it("assigns gold once lifetime spend reaches the threshold", () => {
    expect(memberTier({ lifetimeSpend: 150000 }).name).toBe("gold");
  });
});

describe("invoice", () => {
  it("charges bronze members the full subtotal plus shipping", () => {
    const invoice = buildInvoice({ subtotal: 2000, shipping: 500 }, {});
    expect(invoice.tier).toBe("bronze");
    expect(invoice.discount).toBe(0);
    expect(invoice.total).toBe(2500);
  });
});
