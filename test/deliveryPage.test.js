import { describe, it, expect } from "vitest";
import { renderDeliveryPanel, prettyDate } from "../src/deliveryPage.js";

describe("delivery panel", () => {
  it("formats dates for the panel", () => {
    expect(prettyDate("2026-03-10")).toBe("Tue, Mar 10");
  });

  it("renders one row per shipment plus the promise row", () => {
    const order = {
      placedAt: "2026-03-10T10:00:00Z",
      destRegion: "east",
      lines: [{ sku: "STK-1", qty: 1 }],
    };
    const rows = renderDeliveryPanel(order);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Shipment 1 from east-1");
    expect(rows[1]).toBe("Arrives by Wed, Mar 11");
  });
});
