import { describe, it, expect } from "vitest";
import { qualifyingSpend } from "../src/loyaltyWindow.js";

describe("loyalty qualifying spend", () => {
  it("totals orders within the qualifying window", () => {
    const orders = [
      { placedAt: "2026-02-01", totalCents: 30000 },
      { placedAt: "2026-04-10", totalCents: 40000 },
    ];
    expect(qualifyingSpend(orders, "2026-06-15")).toBe(70000);
  });

  it("is zero for a customer with no orders", () => {
    expect(qualifyingSpend([], "2026-06-15")).toBe(0);
  });
});
