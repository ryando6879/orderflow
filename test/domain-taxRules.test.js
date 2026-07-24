import { describe, it, expect } from "vitest";
import { rateBps, taxableBase, taxFor, taxLabel } from "../src/domain/taxRules.js";

describe("tax rates", () => {
  it("looks up a region's rate", () => {
    expect(rateBps("us")).toBe(800);
    expect(rateBps("US-CA")).toBe(825);
  });

  it("falls back to the rest-of-world rate for an unknown region", () => {
    expect(rateBps("apac")).toBe(0);
    expect(rateBps(undefined)).toBe(0);
  });

  it("labels the rate for an invoice line", () => {
    expect(taxLabel("us")).toBe("Sales tax (8.00%)");
    expect(taxLabel("us-ca")).toBe("Sales tax (8.25%)");
  });
});

describe("taxable base", () => {
  it("excludes shipping where shipping is not taxable", () => {
    expect(taxableBase({ merchandise: 1000, discount: 0, shipping: 500, region: "us" })).toBe(1000);
  });

  it("includes shipping where shipping is taxable", () => {
    expect(taxableBase({ merchandise: 1000, discount: 0, shipping: 500, region: "us-ny" })).toBe(1500);
  });
});

describe("tax owed", () => {
  it("charges the region's rate on an undiscounted order", () => {
    expect(taxFor({ merchandise: 1000, discount: 0, shipping: 500, region: "us" })).toBe(80);
  });

  it("charges nothing in an untaxed region", () => {
    expect(taxFor({ merchandise: 5000, discount: 0, shipping: 1400, region: "row" })).toBe(0);
  });

  it("taxes shipping too where the region says so", () => {
    expect(taxFor({ merchandise: 1000, discount: 0, shipping: 500, region: "us-ny" })).toBe(133);
  });
});
