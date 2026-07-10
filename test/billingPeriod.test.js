import { describe, it, expect } from "vitest";
import { periodInfo } from "../src/billingPeriod.js";

describe("billing period split", () => {
  it("counts the full days before the change date as used", () => {
    const period = periodInfo("2026-03-01", "2026-03-31", "2026-03-11");
    expect(period.daysUsed).toBe(10);
  });

  it("uses zero days when the change lands on the first day", () => {
    const period = periodInfo("2026-04-01", "2026-04-30", "2026-04-01");
    expect(period.daysUsed).toBe(0);
  });
});
