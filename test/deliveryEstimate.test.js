import { describe, it, expect } from "vitest";
import { deliveryPromise } from "../src/deliveryEstimate.js";

describe("delivery promise", () => {
  it("promises next-day local delivery for a midweek in-stock order", () => {
    // Tuesday morning, east-coast customer, stickers stocked in east-1:
    // dispatches same day, one transit day, arrives Wednesday.
    const order = {
      placedAt: "2026-03-10T10:00:00Z",
      destRegion: "east",
      lines: [{ sku: "STK-1", qty: 1 }],
    };
    const promise = deliveryPromise(order);
    expect(promise.shipments).toHaveLength(1);
    expect(promise.shipments[0].dispatchDate).toBe("2026-03-10");
    expect(promise.promiseDate).toBe("2026-03-11");
  });
});
