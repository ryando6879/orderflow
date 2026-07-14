import { describe, it, expect } from "vitest";
import { addBusinessDays, isBusinessDay } from "../src/businessDays.js";

describe("business-day math", () => {
  it("advances across midweek days", () => {
    // Monday + 2 business days = Wednesday.
    expect(addBusinessDays("2026-03-09", 2)).toBe("2026-03-11");
  });

  it("treats a midweek day as a business day", () => {
    expect(isBusinessDay("2026-03-11")).toBe(true);
  });

  it("never counts a Sunday", () => {
    expect(isBusinessDay("2026-03-08")).toBe(false);
  });
});
