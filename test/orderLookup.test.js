import { describe, it, expect } from "vitest";
import { findOrder } from "../src/orderLookup.js";

const orders = [
  { orderNumber: "ORD-1001", email: "amy@example.com", items: 3 },
  { orderNumber: "ORD-1002", email: "ben@example.com", items: 1 },
];

describe("guest order lookup", () => {
  it("finds an order by number and email", () => {
    expect(findOrder(orders, "ORD-1001", "amy@example.com")).toBe(orders[0]);
  });

  it("returns null for an unknown order number", () => {
    expect(findOrder(orders, "ORD-9999", "amy@example.com")).toBeNull();
  });

  it("returns null when the email belongs to a different order", () => {
    expect(findOrder(orders, "ORD-1001", "ben@example.com")).toBeNull();
  });
});
