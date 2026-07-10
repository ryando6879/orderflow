import { describe, it, expect } from "vitest";
import { getPlan, PLANS } from "../src/plans.js";

describe("membership plans", () => {
  it("looks up a plan by id", () => {
    expect(getPlan("pro").priceCents).toBe(3600);
    expect(getPlan("basic").name).toBe("Basic");
  });

  it("throws on an unknown plan id", () => {
    expect(() => getPlan("gold")).toThrow(/unknown plan/);
  });

  it("prices every plan in whole cents", () => {
    for (const plan of Object.values(PLANS)) {
      expect(Number.isInteger(plan.priceCents)).toBe(true);
    }
  });
});
