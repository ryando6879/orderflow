import { describe, it, expect } from "vitest";
import { payWithCredit } from "../src/creditCheckout.js";
import { creditBalance } from "../src/creditLedger.js";

describe("paying with store credit", () => {
  it("covers a smaller order entirely from credit", () => {
    const events = [{ id: "evt-g-9", type: "grant", amountCents: 5000 }];

    const { appliedCents, cardCents } = payWithCredit(events, {
      id: "ORD-4410",
      totalCents: 3000,
    });

    expect(appliedCents).toBe(3000);
    expect(cardCents).toBe(0);
    // The spend lands in the ledger and the remaining balance reflects it.
    expect(events).toHaveLength(2);
    expect(creditBalance(events)).toBe(2000);
  });
});
