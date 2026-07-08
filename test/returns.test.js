import { describe, it, expect } from "vitest";
import { processReturn } from "../src/returns.js";

describe("returns", () => {
  it("refunds merchandise and shipping when the whole order comes back", () => {
    const record = {
      lines: [
        { sku: "TEE-1", qty: 1, paid: 1900 },
        { sku: "MUG-1", qty: 1, paid: 1080 },
      ],
      shippingPaid: 700,
    };
    const result = processReturn(record, [
      { sku: "TEE-1", qty: 1 },
      { sku: "MUG-1", qty: 1 },
    ]);
    expect(result.merchandise).toBe(2980);
    expect(result.shipping).toBe(700);
    expect(result.total).toBe(3680);
  });

  it("keeps the shipping charge when only part of the order comes back", () => {
    const record = {
      lines: [
        { sku: "TEE-1", qty: 1, paid: 1900 },
        { sku: "MUG-1", qty: 1, paid: 1080 },
      ],
      shippingPaid: 700,
    };
    const result = processReturn(record, [{ sku: "TEE-1", qty: 1 }]);
    expect(result.shipping).toBe(0);
  });
});
