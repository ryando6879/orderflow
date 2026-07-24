import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import {
  create,
  byId,
  byNumber,
  update,
  byCustomer,
  recentByCustomer,
  byStatuses,
  placedBetween,
  count,
} from "../src/repositories/orderRepo.js";

function order(id, overrides = {}) {
  return {
    id,
    number: `ORD-${id.toUpperCase()}`,
    customerId: "cus_ada",
    status: "paid",
    placedAt: "2026-07-01T00:00:00.000Z",
    lines: [{ sku: "TEE-1", qty: 1, unitPrice: 1900 }],
    region: "us",
    service: "standard",
    amounts: { merchandise: 1900, discount: 0, tax: 152, shipping: 600, total: 2652 },
    refundedTotal: 0,
    ...overrides,
  };
}

describe("orderRepo", () => {
  beforeEach(() => resetStore());

  it("creates and reads an order", () => {
    create(order("ord_1"));
    expect(byId("ord_1").number).toBe("ORD-ORD_1");
    expect(count()).toBe(1);
  });

  it("looks an order up by its customer-facing number", () => {
    create(order("ord_1", { number: "ORD-7K4M2Q" }));
    expect(byNumber("ORD-7K4M2Q").id).toBe("ord_1");
    expect(byNumber("ORD-NOPE")).toBeUndefined();
  });

  it("stamps updatedAt on a change", () => {
    create(order("ord_1"));
    const updated = update("ord_1", { status: "fulfilled" });
    expect(updated.status).toBe("fulfilled");
    expect(updated.updatedAt).toBeTypeOf("string");
  });

  it("lists a customer's orders newest first", () => {
    create(order("ord_1", { placedAt: "2026-07-01T00:00:00.000Z" }));
    create(order("ord_2", { placedAt: "2026-07-09T00:00:00.000Z" }));
    create(order("ord_3", { customerId: "cus_ben" }));
    expect(byCustomer("cus_ada").map((row) => row.id)).toEqual(["ord_2", "ord_1"]);
  });

  it("returns a short history newest first", () => {
    create(order("ord_1", { placedAt: "2026-07-01T00:00:00.000Z" }));
    create(order("ord_2", { placedAt: "2026-07-09T00:00:00.000Z" }));
    expect(recentByCustomer("cus_ada", 5).map((row) => row.id)).toEqual(["ord_2", "ord_1"]);
  });

  it("lists orders in a set of statuses, oldest first", () => {
    create(order("ord_1", { status: "pending", placedAt: "2026-07-02T00:00:00.000Z" }));
    create(order("ord_2", { status: "paid", placedAt: "2026-07-01T00:00:00.000Z" }));
    create(order("ord_3", { status: "closed" }));
    expect(byStatuses(["pending", "paid"]).map((row) => row.id)).toEqual(["ord_2", "ord_1"]);
  });

  it("lists orders placed inside a range", () => {
    create(order("ord_1", { placedAt: "2026-06-30T00:00:00.000Z" }));
    create(order("ord_2", { placedAt: "2026-07-05T00:00:00.000Z" }));
    const rows = placedBetween("2026-07-01T00:00:00.000Z", "2026-07-31T00:00:00.000Z");
    expect(rows.map((row) => row.id)).toEqual(["ord_2"]);
  });
});
