import { describe, it, expect } from "vitest";
import { planChangeLines } from "../src/planChange.js";

describe("plan change invoice lines", () => {
  const subscription = {
    planId: "basic",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
  };

  it("builds a charge line and a credit line", () => {
    const lines = planChangeLines(subscription, "pro", "2026-03-11");
    expect(lines).toHaveLength(2);
    expect(lines[0].description).toBe("Pro plan for the rest of the period");
    expect(lines[0].amountCents).toBeGreaterThan(0);
    expect(lines[1].description).toBe("Credit for unused time on Basic");
    expect(lines[1].amountCents).toBeLessThan(0);
  });
});
