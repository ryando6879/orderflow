import { describe, it, expect } from "vitest";
import { sortForHistory } from "../src/orderSort.js";

describe("order history sort", () => {
  it("returns a new array without mutating the input", () => {
    const orders = [{ placedAt: 5 }, { placedAt: 9 }];
    const sorted = sortForHistory(orders);
    expect(sorted).not.toBe(orders);
    expect(orders[0].placedAt).toBe(5);
  });

  it("keeps a single order as the only row", () => {
    const sorted = sortForHistory([{ placedAt: 7 }]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].placedAt).toBe(7);
  });
});
