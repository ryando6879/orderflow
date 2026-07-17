import { describe, it, expect } from "vitest";
import { findOrder } from "../src/orderLookup.js";

const orders = [
  { orderNumber: "ORD-1001", email: "amy@example.com", items: 3 },
  { orderNumber: "ORD-1002", email: "ben@example.com", items: 1 },
];

describe("guest order lookup - case-insensitive email", () => {
  it("finds an order when customer types email with different casing", () => {
    const result = findOrder(orders, "ORD-1001", "Amy@Example.com");
    expect(result).toBe(orders[0]);
  });

  it("finds an order when customer types email in all uppercase", () => {
    const result = findOrder(orders, "ORD-1002", "BEN@EXAMPLE.COM");
    expect(result).toBe(orders[1]);
  });

  it("finds an order when customer types email with surrounding whitespace", () => {
    const result = findOrder(orders, "ORD-1001", " amy@example.com ");
    expect(result).toBe(orders[0]);
  });

  it("finds an order with both different casing and whitespace", () => {
    const result = findOrder(orders, "ORD-1001", " Amy@Example.COM ");
    expect(result).toBe(orders[0]);
  });

  it("still returns null for wrong email even with case variations", () => {
    const result = findOrder(orders, "ORD-1001", "Ben@Example.com");
    expect(result).toBeNull();
  });
});
