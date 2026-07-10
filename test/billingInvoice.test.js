import { describe, it, expect } from "vitest";
import { invoiceSummary } from "../src/billingInvoice.js";

describe("invoice totalling", () => {
  it("totals a first invoice with tax", () => {
    // A brand-new Pro signup: one charge line, no credits.
    const lines = [
      { description: "Pro plan", amountCents: 3600 },
    ];
    const summary = invoiceSummary(lines);
    expect(summary.subtotal).toBe(3600);
    expect(summary.tax).toBe(288); // 8% of 3600
    expect(summary.total).toBe(3888);
  });

  it("totals an empty invoice to zero", () => {
    expect(invoiceSummary([]).total).toBe(0);
  });
});
