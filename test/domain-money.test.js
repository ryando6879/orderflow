import { describe, it, expect } from "vitest";
import { sumCents, applyPercent, discountBy, formatCents, allocate, splitEvenly } from "../src/domain/money.js";

describe("cent arithmetic", () => {
  it("sums amounts", () => {
    expect(sumCents([100, 250, 5])).toBe(355);
    expect(sumCents([])).toBe(0);
  });

  it("takes a percentage", () => {
    expect(applyPercent(1000, 10)).toBe(100);
    expect(applyPercent(1999, 10)).toBe(200);
  });

  it("discounts by a percentage", () => {
    expect(discountBy(1000, 10)).toBe(900);
    expect(discountBy(1000, 0)).toBe(1000);
  });
});

describe("formatting", () => {
  it("renders dollars and cents", () => {
    expect(formatCents(1234)).toBe("$12.34");
    expect(formatCents(7)).toBe("$0.07");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("renders negatives with the sign before the symbol", () => {
    expect(formatCents(-500)).toBe("-$5.00");
  });

  it("honours the currency", () => {
    expect(formatCents(1000, "gbp")).toBe("£10.00");
  });
});

describe("allocation", () => {
  it("splits in proportion to the weights", () => {
    expect(allocate(1000, [1, 3])).toEqual([250, 750]);
  });

  it("splits evenly across two parts", () => {
    expect(allocate(1000, [1, 1])).toEqual([500, 500]);
  });

  it("gives everyone zero when the weights are all zero", () => {
    expect(allocate(500, [0, 0])).toEqual([0, 0]);
  });

  it("splits a total into equal parts", () => {
    expect(splitEvenly(1000, 4)).toEqual([250, 250, 250, 250]);
  });
});
