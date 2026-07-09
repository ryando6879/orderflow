import { describe, it, expect } from "vitest";
import { renderTrackingPage } from "../src/trackingPage.js";

describe("tracking page", () => {
  const order = {
    id: "ORD-1",
    events: [{ status: "placed", at: "2026-07-01T09:00:00Z" }],
  };

  it("renders a full document that links the stylesheet", () => {
    const html = renderTrackingPage(order);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('<link rel="stylesheet" href="/styles.css" />');
    expect(html).toContain("Order ORD-1");
  });

  it("highlights the step the order is on", () => {
    const html = renderTrackingPage(order);
    expect(html).toContain('class="step step--current"');
    expect(html).toContain('style="width: 0%"');
  });
});
