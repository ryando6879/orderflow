import { describe, it, expect } from "vitest";
import { renderPlanChange } from "../src/billingPage.js";

describe("plan change confirmation panel", () => {
  const subscription = {
    planId: "basic",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  };

  it("renders the invoice lines, tax, and total rows", () => {
    const rows = renderPlanChange(subscription, "pro", "2026-03-11");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain("Pro plan for the rest of the period");
    expect(rows[1]).toContain("Credit for unused time on Basic");
    expect(rows[2]).toMatch(/^Tax \(8%\)/);
    expect(rows[3]).toMatch(/^Total due today {2}\$\d+\.\d{2}$/);
  });
});
