import { describe, it, expect } from "vitest";
import { historyPage, PAGE_SIZE } from "../src/historyPage.js";

describe("order history page", () => {
  const orders = [
    { orderNumber: "ORD-1", placedAt: 1000 },
    { orderNumber: "ORD-2", placedAt: 2000 },
  ];

  it("shows a short history on the first page", () => {
    const rows = historyPage(orders, 1);
    expect(rows).toHaveLength(2);
    const numbers = rows.map((o) => o.orderNumber);
    expect(numbers).toContain("ORD-1");
    expect(numbers).toContain("ORD-2");
  });

  it("returns an empty page past the end of the list", () => {
    expect(historyPage(orders, 2)).toHaveLength(0);
  });

  it("exposes the page size for the pager", () => {
    expect(PAGE_SIZE).toBe(3);
  });
});
