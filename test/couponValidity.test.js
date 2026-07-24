import { describe, it, expect } from "vitest";
import { isCouponValid } from "../src/couponValidity.js";

describe("coupon validity", () => {
  it("accepts a coupon well before its expiry", () => {
    expect(
      isCouponValid({ code: "SPRING20", expiresOn: "2026-03-31" }, "2026-03-15")
    ).toBe(true);
  });

  it("rejects a coupon after its expiry has passed", () => {
    expect(
      isCouponValid({ code: "SPRING20", expiresOn: "2026-03-31" }, "2026-04-05")
    ).toBe(false);
  });
});
