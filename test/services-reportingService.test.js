import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { create } from "../src/repositories/orderRepo.js";
import { revenueSummary, revenueByRegion, ORDER_EXPORT_COLUMNS } from "../src/services/reportingService.js";

const FROM = "2026-07-01T00:00:00.000Z";
const TO = "2026-07-31T23:59:59.000Z";

function order(id, overrides = {}) {
  return {
    id,
    number: `ORD-${id}`,
    customerId: "cus_ada",
    status: "fulfilled",
    placedAt: "2026-07-10T00:00:00.000Z",
    region: "us",
    service: "standard",
    lines: [{ sku: "TEE-1", qty: 1, unitPrice: 1900 }],
    amounts: { merchandise: 1900, discount: 0, tax: 152, shipping: 600, total: 2652 },
    refundedTotal: 0,
    ...overrides,
  };
}

describe("revenue summary", () => {
  beforeEach(() => resetStore());

  it("is empty with no orders", () => {
    const summary = revenueSummary(FROM, TO);
    expect(summary.orderCount).toBe(0);
    expect(summary.gross).toBe(0);
    expect(summary.net).toBe(0);
  });

  it("adds up the orders in the window", () => {
    create(order("a"));
    create(order("b", { amounts: { merchandise: 1200, discount: 0, tax: 96, shipping: 600, total: 1896 } }));
    const summary = revenueSummary(FROM, TO);
    expect(summary.orderCount).toBe(2);
    expect(summary.gross).toBe(4548);
    expect(summary.net).toBe(4548);
    expect(summary.tax).toBe(248);
    expect(summary.shipping).toBe(1200);
  });

  it("ignores orders outside the window", () => {
    create(order("a"));
    create(order("old", { placedAt: "2026-05-02T00:00:00.000Z" }));
    expect(revenueSummary(FROM, TO).orderCount).toBe(1);
  });

  it("formats the gross for the header tile", () => {
    create(order("a"));
    expect(revenueSummary(FROM, TO).grossFormatted).toBe("$26.52");
  });
});

describe("revenue by region", () => {
  beforeEach(() => resetStore());

  it("groups and sorts by gross, biggest first", () => {
    create(order("a", { region: "eu" }));
    create(order("b", { region: "us" }));
    create(order("c", { region: "us" }));
    const rows = revenueByRegion(FROM, TO);
    expect(rows[0].region).toBe("us");
    expect(rows[0].orderCount).toBe(2);
    expect(rows[1].region).toBe("eu");
  });
});

describe("the export shape", () => {
  it("keeps the columns finance expects", () => {
    expect(ORDER_EXPORT_COLUMNS[0]).toBe("number");
    expect(ORDER_EXPORT_COLUMNS).toContain("total");
  });
});
