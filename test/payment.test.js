import { describe, it, expect } from "vitest";
import { captureOrder } from "../src/payment.js";

describe("payment capture", () => {
  it("records what the customer paid on a single-line order", () => {
    const invoice = { discount: 200, promoDiscount: 0 };
    const record = captureOrder("ORD-1", [{ sku: "TEE-1", qty: 2, lineSubtotal: 3800 }], invoice, 700);
    expect(record.orderId).toBe("ORD-1");
    expect(record.lines).toEqual([{ sku: "TEE-1", qty: 2, paid: 3600 }]);
    expect(record.shippingPaid).toBe(700);
  });

  it("records full line prices when no discounts apply", () => {
    const invoice = { discount: 0, promoDiscount: 0 };
    const record = captureOrder(
      "ORD-2",
      [
        { sku: "TEE-1", qty: 1, lineSubtotal: 1900 },
        { sku: "STK-1", qty: 2, lineSubtotal: 1200 },
      ],
      invoice,
      500
    );
    expect(record.lines.map((l) => l.paid)).toEqual([1900, 1200]);
  });
});
