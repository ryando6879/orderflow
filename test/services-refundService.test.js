import { describe, it, expect } from "vitest";
import { refundableBalance, allocateAcrossLines } from "../src/services/refundService.js";

describe("refundable balance", () => {
  it("is the whole total on an order that has never been refunded", () => {
    expect(refundableBalance({ id: "ord_1", amounts: { total: 5000 }, refundedTotal: 0 })).toBe(5000);
  });

  it("is never negative", () => {
    expect(refundableBalance({ id: "ord_1", amounts: { total: 0 }, refundedTotal: 0 })).toBe(0);
  });
});

describe("allocating a refund across lines", () => {
  it("splits in proportion to what each line contributed", () => {
    const order = {
      lines: [
        { sku: "A", qty: 1, unitPrice: 1000 },
        { sku: "B", qty: 1, unitPrice: 3000 },
      ],
    };
    expect(allocateAcrossLines(order, 1000)).toEqual([
      { sku: "A", amountCents: 250 },
      { sku: "B", amountCents: 750 },
    ]);
  });

  it("gives a single-line order the whole amount", () => {
    const order = { lines: [{ sku: "A", qty: 2, unitPrice: 1500 }] };
    expect(allocateAcrossLines(order, 3000)).toEqual([{ sku: "A", amountCents: 3000 }]);
  });
});
