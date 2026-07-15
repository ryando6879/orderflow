import { describe, it, expect } from "vitest";
import { canCancel } from "../src/cancellation.js";

const NOW = 1750000000000;

describe("order cancellation", () => {
  it("allows cancelling at the moment the order is placed", () => {
    expect(canCancel({ placedAt: NOW, status: "placed" }, NOW)).toBe(true);
  });

  it("rejects cancelling an order from yesterday", () => {
    const placedAt = NOW - 24 * 60 * 60 * 1000;
    expect(canCancel({ placedAt, status: "placed" }, NOW)).toBe(false);
  });

  it("never allows cancelling a shipped order", () => {
    expect(canCancel({ placedAt: NOW, status: "shipped" }, NOW)).toBe(false);
  });
});
