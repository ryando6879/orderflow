import { describe, it, expect } from "vitest";
import { totalSpent, headline } from "../src/accountSummary.js";

describe("account summary strip", () => {
  const orders = [
    {
      id: "ORD-2001",
      placedAt: "2026-03-14T10:00:00Z",
      subtotal: 3000,
      total: 3000,
    },
    {
      id: "ORD-2003",
      placedAt: "2026-04-02T10:00:00Z",
      subtotal: 4500,
      total: 4500,
    },
  ];

  it("adds up what the customer spent", () => {
    expect(totalSpent(orders)).toBe(7500);
  });

  it("formats the headline strip", () => {
    expect(headline(orders)).toBe("2 orders · $75.00 this year");
  });

  it("handles a brand-new account", () => {
    expect(totalSpent([])).toBe(0);
    expect(headline([])).toBe("0 orders · $0.00 this year");
  });
});
