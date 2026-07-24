import { describe, it, expect } from "vitest";
import { currentTier } from "../src/loyaltyStatus.js";

describe("loyalty tier", () => {
  it("puts a mid-Silver spender in Silver", () => {
    const orders = [{ placedAt: "2026-02-01", totalCents: 70000 }];
    expect(currentTier(orders, "2026-06-15")).toBe("Silver");
  });

  it("puts a mid-Gold spender in Gold", () => {
    const orders = [{ placedAt: "2026-02-01", totalCents: 150000 }];
    expect(currentTier(orders, "2026-06-15")).toBe("Gold");
  });
});
