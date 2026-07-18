import { describe, it, expect } from "vitest";
import { planChangeLines } from "../src/planChange.js";

describe("planChange - March 11 Basic→Pro upgrade billing", () => {
  it("charges correct prorated amounts for mid-month upgrade", () => {
    // Customer scenario from report: monthly Basic ($12) subscriber,
    // billing period Mar 1-31 (31 days), upgrades to Pro ($36) on Mar 11.
    // Mar 1-10 = 10 days used on Basic, Mar 11-31 = 21 days remaining on Pro.
    const subscription = {
      planId: "basic",
      periodStart: "2026-03-01",
      periodEnd: "2026-03-31",
    };

    const lines = planChangeLines(subscription, "pro", "2026-03-11");

    // Expected: Pro charge = $36 × (21/31) = $24.39 → rounds to 2439 cents
    expect(lines[0].description).toBe("Pro plan for the rest of the period");
    expect(lines[0].amountCents).toBe(2439);

    // Expected: Basic credit = $12 × (21/31) = $8.13 → rounds to 813 cents
    // (negative because it's a credit)
    expect(lines[1].description).toBe("Credit for unused time on Basic");
    expect(lines[1].amountCents).toBe(-813);

    // Net pre-tax total should be 2439 - 813 = 1626 cents ($16.26)
    const netCents = lines[0].amountCents + lines[1].amountCents;
    expect(netCents).toBe(1626);
  });
});
