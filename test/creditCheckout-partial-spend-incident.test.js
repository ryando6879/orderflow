import { describe, it, expect } from "vitest";
import { payWithCredit } from "../src/creditCheckout.js";
import { creditBalance } from "../src/creditLedger.js";

describe("store-credit order ledger correctness", () => {
  it("records spend event for the actual credit applied, not the full order total", () => {
    // Customer has $30 credit but order costs $50 — credit covers part, card pays the rest.
    const events = [{ id: "evt-g-9", type: "grant", amountCents: 3000 }];

    const { appliedCents, cardCents } = payWithCredit(events, {
      id: "ORD-4410",
      totalCents: 5000,
    });

    // Credit covers $30, card pays the remaining $20.
    expect(appliedCents).toBe(3000);
    expect(cardCents).toBe(2000);

    // The spend event must record the APPLIED amount (3000), not the order total (5000).
    // When it incorrectly records 5000, the admin panel's credit reconciliation detects
    // a mismatch (ledger says 5000 spent but order shows only 3000 applied) and fails
    // to render the order details.
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("spend");
    expect(events[1].amountCents).toBe(3000);

    // The remaining balance must be zero (3000 granted - 3000 spent).
    expect(creditBalance(events)).toBe(0);
  });
});
