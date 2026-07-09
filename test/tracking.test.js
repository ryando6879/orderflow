import { describe, it, expect } from "vitest";
import { trackingModel } from "../src/tracking.js";

describe("tracking view-model", () => {
  const placedOrder = {
    events: [{ status: "placed", at: "2026-07-01T09:00:00Z" }],
  };

  it("labels every step of the journey", () => {
    const { steps } = trackingModel(placedOrder);
    expect(steps.map((s) => s.label)).toEqual([
      "Order placed",
      "Processing",
      "Shipped",
      "Delivered",
    ]);
  });

  it("marks a fresh order at the start of the journey", () => {
    const { steps, percent } = trackingModel(placedOrder);
    expect(steps[0].state).toBe("current");
    expect(steps.slice(1).every((s) => s.state === "todo")).toBe(true);
    expect(percent).toBe(0);
  });
});
