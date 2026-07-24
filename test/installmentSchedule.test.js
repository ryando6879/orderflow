import { describe, it, expect } from "vitest";
import { installmentDueDates } from "../src/installmentSchedule.js";

describe("pay-in-4 due dates", () => {
  it("produces one due date per installment", () => {
    expect(installmentDueDates("2026-03-06", 4)).toHaveLength(4);
  });

  it("spaces consecutive installments two weeks apart", () => {
    const dates = installmentDueDates("2026-03-06", 4);
    // The gap between each pair of charges is 14 days.
    const gap = (a, b) =>
      (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000;
    expect(gap(dates[0], dates[1])).toBe(14);
    expect(gap(dates[1], dates[2])).toBe(14);
    expect(gap(dates[2], dates[3])).toBe(14);
  });
});
