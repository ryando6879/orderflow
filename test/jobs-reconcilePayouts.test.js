import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { create } from "../src/repositories/orderRepo.js";
import { payoutTotalCents, ourTotalCents } from "../src/jobs/reconcilePayouts.js";

describe("payout totals", () => {
  it("is zero for an empty payout", () => {
    expect(payoutTotalCents([])).toBe(0);
  });

  it("adds up a small batch", () => {
    expect(payoutTotalCents([{ amount: 1000 }, { amount: 2500 }])).toBe(3500);
  });

  it("returns whole cents", () => {
    expect(Number.isInteger(payoutTotalCents([{ amount: 1234 }, { amount: 4321 }]))).toBe(true);
  });
});

describe("our side of the reconciliation", () => {
  beforeEach(() => resetStore());

  it("sums the orders the payout references", () => {
    create({
      id: "ord_1",
      number: "ORD-1",
      customerId: "cus_ada",
      status: "fulfilled",
      placedAt: "2026-07-01T00:00:00.000Z",
      lines: [],
      region: "us",
      service: "standard",
      amounts: { merchandise: 1000, discount: 0, tax: 80, shipping: 600, total: 1680 },
    });
    expect(ourTotalCents(["ord_1"])).toBe(1680);
  });

  it("ignores references we do not know", () => {
    expect(ourTotalCents(["ord_missing"])).toBe(0);
  });
});
