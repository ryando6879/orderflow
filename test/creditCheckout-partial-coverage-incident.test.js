import { describe, it, expect } from "vitest";
import { payWithCredit } from "../src/creditCheckout.js";
import { creditBalance } from "../src/creditLedger.js";

describe("store credit partial coverage incident", () => {
  it("records spend event for appliedCents only when credit partially covers order", () => {
    // Customer has $20 store credit
    const events = [{ id: "evt-g-1", type: "grant", amountCents: 2000 }];

    // Customer places $35 order
    const { appliedCents, cardCents } = payWithCredit(events, {
      id: "ORD-5521",
      totalCents: 3500,
    });

    // Credit should cover $20, card should pay $15
    expect(appliedCents).toBe(2000);
    expect(cardCents).toBe(1500);

    // The spend event should record only the $20 actually applied
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("spend");
    expect(events[1].amountCents).toBe(2000);

    // Balance should be $0 after spending $20 of $20 available
    expect(creditBalance(events)).toBe(0);
  });
});
