import { describe, it, expect } from "vitest";
import { chargedAmount, orderRow } from "../src/orderHistory.js";

describe("order history rows", () => {
  // digital pickup order: no tax collected, nothing to ship
  const order = {
    id: "ORD-2001",
    placedAt: "2026-03-14T10:00:00Z",
    subtotal: 3000,
    total: 3000,
  };

  it("shows what a simple order cost", () => {
    expect(chargedAmount(order)).toBe(3000);
  });

  it("renders a row the account page can print", () => {
    expect(orderRow(order)).toBe("ORD-2001 · 2026-03-14 · $30.00");
  });

  it("marks cancelled orders in their row", () => {
    const cancelled = {
      id: "ORD-2002",
      placedAt: "2026-03-20T10:00:00Z",
      subtotal: 1500,
      total: 1500,
      cancelled: true,
    };
    expect(orderRow(cancelled)).toContain("(cancelled)");
  });
});
