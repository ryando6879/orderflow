import { describe, it, expect } from "vitest";
import { creditBalance } from "../src/creditLedger.js";

describe("store-credit ledger", () => {
  it("starts at zero with no history", () => {
    expect(creditBalance([])).toBe(0);
  });

  it("adds grants and refunds to the balance", () => {
    expect(
      creditBalance([
        { id: "evt-1", type: "grant", amountCents: 1500 },
        { id: "evt-2", type: "refund_to_credit", amountCents: 700 },
      ])
    ).toBe(2200);
  });

  it("subtracts spends from the balance", () => {
    expect(
      creditBalance([
        { id: "evt-3", type: "grant", amountCents: 3000 },
        { id: "evt-4", type: "spend", amountCents: 1100 },
      ])
    ).toBe(1900);
  });
});
