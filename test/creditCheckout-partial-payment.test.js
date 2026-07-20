import { describe, it, expect } from "vitest";
import { payWithCredit } from "../src/creditCheckout.js";
import { creditBalance } from "../src/creditLedger.js";

describe("creditCheckout partial payment bug", () => {
  it("records spend event for appliedCents only, not full order total", () => {
    // Reproduce the reported scenario: $20 credit applied to $35 order
    const events = [
      { id: "evt-grant-1", type: "grant", amountCents: 2000 },
    ];
    const order = { id: "ORD-123", totalCents: 3500 };

    // Initial balance should be $20
    expect(creditBalance(events)).toBe(2000);

    // Apply credit to the order
    const result = payWithCredit(events, order);

    // Should apply $20 credit and charge $15 to card
    expect(result.appliedCents).toBe(2000);
    expect(result.cardCents).toBe(1500);

    // The spend event must record only the $20 actually applied,
    // not the $35 order total. Balance after spend should be $0.
    expect(creditBalance(events)).toBe(0);
  });

  it("records correct spend when credit fully covers order", () => {
    const events = [
      { id: "evt-grant-2", type: "grant", amountCents: 5000 },
    ];
    const order = { id: "ORD-456", totalCents: 3500 };

    expect(creditBalance(events)).toBe(5000);

    const result = payWithCredit(events, order);

    // Should apply full $35 from credit, no card charge
    expect(result.appliedCents).toBe(3500);
    expect(result.cardCents).toBe(0);

    // Balance should be $50 - $35 = $15 remaining
    expect(creditBalance(events)).toBe(1500);
  });

  it("records correct spend when order exceeds available credit", () => {
    const events = [
      { id: "evt-grant-3", type: "grant", amountCents: 1000 },
    ];
    const order = { id: "ORD-789", totalCents: 3500 };

    expect(creditBalance(events)).toBe(1000);

    const result = payWithCredit(events, order);

    // Should apply only $10 available credit, charge $25 to card
    expect(result.appliedCents).toBe(1000);
    expect(result.cardCents).toBe(2500);

    // Balance should be fully depleted to $0
    expect(creditBalance(events)).toBe(0);
  });
});
