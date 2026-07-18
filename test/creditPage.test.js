import { describe, it, expect } from "vitest";
import { creditPanel } from "../src/creditPage.js";

describe("store-credit panel", () => {
  it("formats the balance in dollars", () => {
    expect(
      creditPanel([{ id: "evt-g-2", type: "grant", amountCents: 1250 }])
    ).toBe("Store credit: $12.50");
  });

  it("shows zero for a customer with no credit history", () => {
    expect(creditPanel([])).toBe("Store credit: $0.00");
  });
});
