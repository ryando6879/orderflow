import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, reset, bucketKey } from "../src/http/middleware/rateLimit.js";
import { config } from "../src/config/index.js";

function context(remoteAddress = "203.0.113.5") {
  const headers = {};
  return {
    req: { headers, socket: { remoteAddress } },
    res: { setHeader() {} },
  };
}

describe("bucket keys", () => {
  it("prefers the api key when there is one", () => {
    const ctx = context();
    ctx.auth = { keyId: "key_storefront" };
    expect(bucketKey(ctx)).toBe("key_storefront");
  });

  it("falls back to the client address", () => {
    expect(bucketKey(context("198.51.100.9"))).toBe("198.51.100.9");
  });
});

describe("rateLimit", () => {
  beforeEach(() => reset());

  it("allows a request under the limit", () => {
    const result = rateLimit(context(), 1_000_000);
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(config.rateLimit.requestsPerMinute - 1);
  });

  it("counts requests down to zero remaining", () => {
    const ctx = context();
    let last;
    for (let i = 0; i < config.rateLimit.requestsPerMinute; i += 1) {
      last = rateLimit(ctx, 1_000_000);
    }
    expect(last.ok).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it("rejects the request that goes over the limit", () => {
    const ctx = context();
    for (let i = 0; i < config.rateLimit.requestsPerMinute; i += 1) {
      rateLimit(ctx, 1_000_000);
    }
    const over = rateLimit(ctx, 1_000_000);
    expect(over.ok).toBe(false);
    expect(over.status).toBe(429);
    expect(over.code).toBe("rate_limited");
  });

  it("counts separate callers separately", () => {
    const a = context("203.0.113.1");
    const b = context("203.0.113.2");
    for (let i = 0; i < config.rateLimit.requestsPerMinute; i += 1) {
      rateLimit(a, 1_000_000);
    }
    expect(rateLimit(b, 1_000_000).ok).toBe(true);
  });
});
