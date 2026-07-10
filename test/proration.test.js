import { describe, it, expect } from "vitest";
import { unusedCredit, remainderCharge } from "../src/proration.js";
import { getPlan } from "../src/plans.js";

describe("plan-change proration", () => {
  // A change exactly halfway through a 30-day period.
  const midPeriod = { daysInPeriod: 30, daysUsed: 15, daysRemaining: 15 };

  it("credits half the old plan at mid-period", () => {
    expect(unusedCredit(getPlan("basic"), midPeriod)).toBe(600);
  });

  it("charges half the new plan at mid-period", () => {
    expect(remainderCharge(getPlan("pro"), midPeriod)).toBe(1800);
  });

  it("rounds the charge to whole cents", () => {
    const period = { daysInPeriod: 30, daysUsed: 15, daysRemaining: 15 };
    expect(Number.isInteger(remainderCharge(getPlan("team"), period))).toBe(
      true
    );
  });
});
