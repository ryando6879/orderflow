import { describe, it, expect } from "vitest";
import { authenticate, requireScope, findKey } from "../src/http/middleware/auth.js";

function context(headers = {}) {
  return { req: { headers }, res: { setHeader() {} } };
}

describe("authenticate", () => {
  it("rejects a request with no key", () => {
    const result = authenticate(context());
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.code).toBe("missing_api_key");
  });

  it("rejects a key we never issued", () => {
    const result = authenticate(context({ "x-api-key": "of_live_nope" }));
    expect(result.ok).toBe(false);
    expect(result.code).toBe("invalid_api_key");
  });

  it("accepts the storefront key and attaches its scopes", () => {
    const ctx = context({ "x-api-key": "of_live_storefront" });
    expect(authenticate(ctx).ok).toBe(true);
    expect(ctx.auth.keyId).toBe("key_storefront");
    expect(ctx.auth.scopes).toContain("checkout:write");
  });

  it("carries the customer id through", () => {
    const ctx = context({ "x-api-key": "of_live_storefront", "x-customer-id": "cus_ada" });
    authenticate(ctx);
    expect(ctx.auth.customerId).toBe("cus_ada");
  });

  it("knows its own key records", () => {
    expect(findKey("of_live_admin").label).toBe("admin panel");
  });
});

describe("requireScope", () => {
  it("passes a key that holds the scope", () => {
    const ctx = context({ "x-api-key": "of_live_storefront" });
    authenticate(ctx);
    expect(requireScope("checkout:write")(ctx).ok).toBe(true);
  });

  it("rejects a key that does not", () => {
    const ctx = context({ "x-api-key": "of_live_storefront" });
    authenticate(ctx);
    const result = requireScope("reports:read")(ctx);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(403);
  });

  it("lets an admin key through any scope", () => {
    const ctx = context({ "x-api-key": "of_live_admin" });
    authenticate(ctx);
    expect(requireScope("carts:write")(ctx).ok).toBe(true);
  });

  it("rejects an unauthenticated context", () => {
    expect(requireScope("orders:read")(context()).status).toBe(401);
  });
});
