import { describe, it, expect } from "vitest";
import { planChangeLines } from "../src/planChange.js";
import { invoiceSummary } from "../src/billingInvoice.js";

describe("plan-change invoice tax calculation", () => {
  it("computes tax on net subtotal (charge minus credit), not on charge alone", () => {
    // Reproduce the reported case: Basic→Pro upgrade on Mar 11 in a Mar 1-31 period.
    // The customer had 10 days used (Mar 1-10), 21 days remaining (Mar 11-31).
    // Pro costs $36.00/month; Basic costs $12.00/month.
    // Expected charge: $36.00 × (21/31) = $24.39 (2439 cents)
    // Expected credit: $12.00 × (21/31) = $8.13 (813 cents)
    // Net subtotal: $24.39 - $8.13 = $16.26 (1626 cents)
    // Tax should be: round(1626 × 0.08) = round(130.08) = 130 cents ($1.30)
    // Total should be: 1626 + 130 = 1756 cents ($17.56)
    const subscription = {
      planId: "basic",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
    };
    const lines = planChangeLines(subscription, "pro", "2026-03-11");
    const summary = invoiceSummary(lines);

    // The charge line should be $24.39 (2439 cents)
    expect(lines[0].amountCents).toBe(2439);
    // The credit line should be -$8.13 (-813 cents)
    expect(lines[1].amountCents).toBe(-813);
    // Net subtotal should be $16.26 (1626 cents)
    expect(summary.subtotal).toBe(1626);
    // Tax must be computed on the NET subtotal: $1.30 (130 cents), NOT $1.95 (195 cents)
    expect(summary.tax).toBe(130);
    // Total should be $17.56 (1756 cents), NOT $18.21 (1821 cents)
    expect(summary.total).toBe(1756);
  });
});
