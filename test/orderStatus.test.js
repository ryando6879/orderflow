import { describe, it, expect } from "vitest";
import { currentStatus, STATUS_ORDER } from "../src/orderStatus.js";

describe("order status", () => {
  it("knows the four journey stages", () => {
    expect(STATUS_ORDER).toEqual([
      "placed",
      "processing",
      "shipped",
      "delivered",
    ]);
  });

  it("defaults to placed before any events arrive", () => {
    expect(currentStatus({ events: [] })).toBe("placed");
  });

  it("reads a freshly placed order", () => {
    const order = {
      events: [{ status: "placed", at: "2026-07-01T09:00:00Z" }],
    };
    expect(currentStatus(order)).toBe("placed");
  });

  it("follows the order through fulfillment", () => {
    const order = {
      events: [
        { status: "placed", at: "2026-07-01T09:00:00Z" },
        { status: "processing", at: "2026-07-01T10:00:00Z" },
        { status: "shipped", at: "2026-07-01T15:00:00Z" },
      ],
    };
    expect(currentStatus(order)).toBe("shipped");
  });
});
