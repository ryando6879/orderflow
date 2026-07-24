import { describe, it, expect, beforeEach } from "vitest";
import { once, requestFingerprint, reset } from "../src/lib/idempotency.js";

describe("idempotency", () => {
  beforeEach(() => reset());

  it("runs the handler the first time", async () => {
    let calls = 0;
    const { replayed, result } = await once(
      { customerId: "cus_1", endpoint: "POST /v1/checkout", body: { cartId: "cart_1" } },
      async () => {
        calls += 1;
        return { orderId: "ord_1" };
      }
    );
    expect(calls).toBe(1);
    expect(replayed).toBe(false);
    expect(result).toEqual({ orderId: "ord_1" });
  });

  it("replays the first response when the same request arrives again", async () => {
    let calls = 0;
    const request = { customerId: "cus_1", endpoint: "POST /v1/checkout", body: { cartId: "cart_1" } };
    const handler = async () => {
      calls += 1;
      return { orderId: "ord_1" };
    };
    await once(request, handler);
    const second = await once(request, handler);
    expect(calls).toBe(1);
    expect(second.replayed).toBe(true);
    expect(second.result).toEqual({ orderId: "ord_1" });
  });

  it("keeps different endpoints apart", async () => {
    let calls = 0;
    const handler = async () => {
      calls += 1;
      return calls;
    };
    await once({ customerId: "cus_1", endpoint: "POST /v1/checkout", body: {} }, handler);
    await once({ customerId: "cus_1", endpoint: "POST /v1/refunds", body: {} }, handler);
    expect(calls).toBe(2);
  });

  it("keeps different customers apart", async () => {
    let calls = 0;
    const handler = async () => {
      calls += 1;
      return calls;
    };
    await once({ customerId: "cus_1", endpoint: "POST /v1/checkout", body: {} }, handler);
    await once({ customerId: "cus_2", endpoint: "POST /v1/checkout", body: {} }, handler);
    expect(calls).toBe(2);
  });

  it("uses a client-supplied idempotency key when there is one", () => {
    const key = requestFingerprint({
      customerId: "cus_1",
      endpoint: "POST /v1/checkout",
      body: {},
      idempotencyKey: "abc",
    });
    expect(key).toContain("abc");
  });
});
