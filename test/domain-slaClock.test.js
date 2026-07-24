import { describe, it, expect } from "vitest";
import { isShippingDay, slaDueDate, promiseFor, isBreached, SLA_DAYS } from "../src/domain/slaClock.js";

describe("shipping days", () => {
  it("counts a normal weekday", () => {
    expect(isShippingDay("2026-07-13")).toBe(true);
  });

  it("excludes the weekend", () => {
    expect(isShippingDay("2026-07-18")).toBe(false);
    expect(isShippingDay("2026-07-19")).toBe(false);
  });

  it("excludes an observed holiday", () => {
    expect(isShippingDay("2026-12-25")).toBe(false);
    expect(isShippingDay("2026-11-26")).toBe(false);
  });
});

describe("promise dates", () => {
  it("advances two shipping days inside one week", () => {
    expect(slaDueDate("2026-07-13", 2)).toBe("2026-07-15");
  });

  it("skips the weekend", () => {
    expect(slaDueDate("2026-07-17", 1)).toBe("2026-07-20");
  });

  it("resolves the promise from the service level", () => {
    expect(promiseFor("2026-07-13", "express")).toBe("2026-07-15");
    expect(promiseFor("2026-07-13", "overnight")).toBe("2026-07-14");
  });

  it("rejects an unknown service level", () => {
    expect(() => promiseFor("2026-07-13", "teleport")).toThrow(/unknown service level/);
    expect(Object.keys(SLA_DAYS)).toEqual(["standard", "express", "overnight"]);
  });
});

describe("breaches", () => {
  it("flags a late delivery", () => {
    expect(isBreached("2026-07-15", "2026-07-16")).toBe(true);
  });

  it("does not flag an on-time delivery", () => {
    expect(isBreached("2026-07-15", "2026-07-15")).toBe(false);
    expect(isBreached("2026-07-15", "2026-07-14")).toBe(false);
  });
});
