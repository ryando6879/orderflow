import { describe, it, expect } from "vitest";
import { refundAmount } from "../src/refunds.js";

describe("refunds", () => {
  it("refunds the full paid amount when a whole line comes back", () => {
    const record = { lines: [{ sku: "TEE-1", qty: 2, paid: 3600 }] };
    expect(refundAmount(record, [{ sku: "TEE-1", qty: 2 }])).toBe(3600);
  });

  it("ignores returns for items that are not on the order", () => {
    const record = { lines: [{ sku: "TEE-1", qty: 2, paid: 3600 }] };
    expect(refundAmount(record, [{ sku: "HAT-1", qty: 1 }])).toBe(0);
  });
});
