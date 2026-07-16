import { describe, it, expect } from "vitest";
import { canCancel, CANCEL_WINDOW_MINUTES } from "../src/cancellation.js";

const NOW = 1750000000000;

describe("cancellation window bug reproduction", () => {
  it("allows cancelling an order placed 2 minutes ago (well within 30-minute window)", () => {
    const placedAt = NOW - 2 * 60 * 1000; // 2 minutes ago in milliseconds
    const order = { placedAt, status: "placed" };
    expect(canCancel(order, NOW)).toBe(true);
  });

  it("allows cancelling an order placed 10 minutes ago (within 30-minute window)", () => {
    const placedAt = NOW - 10 * 60 * 1000; // 10 minutes ago in milliseconds
    const order = { placedAt, status: "placed" };
    expect(canCancel(order, NOW)).toBe(true);
  });

  it("allows cancelling an order placed 29 minutes ago (just inside 30-minute window)", () => {
    const placedAt = NOW - 29 * 60 * 1000; // 29 minutes ago in milliseconds
    const order = { placedAt, status: "placed" };
    expect(canCancel(order, NOW)).toBe(true);
  });

  it("rejects cancelling an order placed 31 minutes ago (outside 30-minute window)", () => {
    const placedAt = NOW - 31 * 60 * 1000; // 31 minutes ago in milliseconds
    const order = { placedAt, status: "placed" };
    expect(canCancel(order, NOW)).toBe(false);
  });

  it("allows cancelling exactly at the 30-minute boundary", () => {
    const placedAt = NOW - CANCEL_WINDOW_MINUTES * 60 * 1000; // exactly 30 minutes ago
    const order = { placedAt, status: "placed" };
    expect(canCancel(order, NOW)).toBe(true);
  });
});
