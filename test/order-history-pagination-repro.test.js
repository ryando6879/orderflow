import { describe, it, expect } from "vitest";
import { historyPage } from "../src/historyPage.js";

describe("order history pagination bug reproduction", () => {
  it("shows newest order first on page 1 and older orders on page 2", () => {
    // Reproduce the reported scenario: a customer with a dozen orders
    // expects to see yesterday's order first on page 1, but instead sees
    // oldest orders first, yesterday's order is missing, and page 2 is empty.
    const day = 24 * 60 * 60 * 1000;
    const now = 1784200000000;
    const orders = [
      { orderNumber: "ORD-5001", placedAt: now - 200 * day },
      { orderNumber: "ORD-5002", placedAt: now - 150 * day },
      { orderNumber: "ORD-5003", placedAt: now - 90 * day },
      { orderNumber: "ORD-5004", placedAt: now - 30 * day },
      { orderNumber: "ORD-5005", placedAt: now - 1 * day },
    ];

    // Page 1 should show the 3 newest orders (PAGE_SIZE=3), starting with yesterday's
    const page1 = historyPage(orders, 1);
    expect(page1).toHaveLength(3);
    expect(page1[0].orderNumber).toBe("ORD-5005"); // yesterday (newest)
    expect(page1[1].orderNumber).toBe("ORD-5004"); // 30 days ago
    expect(page1[2].orderNumber).toBe("ORD-5003"); // 90 days ago

    // Page 2 should show the next 2 orders (the oldest ones)
    const page2 = historyPage(orders, 2);
    expect(page2).toHaveLength(2);
    expect(page2[0].orderNumber).toBe("ORD-5002"); // 150 days ago
    expect(page2[1].orderNumber).toBe("ORD-5001"); // 200 days ago (oldest)

    // Page 3 should be empty (past the end of the list)
    const page3 = historyPage(orders, 3);
    expect(page3).toHaveLength(0);
  });
});
