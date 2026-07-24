import { describe, it, expect } from "vitest";
import { Router, compile, matchPath, parseQuery } from "../src/http/router.js";

describe("path matching", () => {
  it("matches a literal path", () => {
    expect(matchPath(compile("/v1/orders"), "/v1/orders")).toEqual({});
  });

  it("captures a path parameter", () => {
    expect(matchPath(compile("/v1/orders/:id"), "/v1/orders/ord_1")).toEqual({ id: "ord_1" });
  });

  it("decodes a path parameter", () => {
    expect(matchPath(compile("/v1/tracking/:code"), "/v1/tracking/1Z%20999")).toEqual({ code: "1Z 999" });
  });

  it("does not match a different segment count", () => {
    expect(matchPath(compile("/v1/orders/:id"), "/v1/orders")).toBeNull();
    expect(matchPath(compile("/v1/orders/:id"), "/v1/orders/ord_1/refunds")).toBeNull();
  });

  it("does not match a different literal", () => {
    expect(matchPath(compile("/v1/orders/:id"), "/v1/carts/cart_1")).toBeNull();
  });
});

describe("query parsing", () => {
  it("reads query parameters", () => {
    expect(parseQuery("?page=2&limit=10")).toEqual({ page: "2", limit: "10" });
  });

  it("handles a missing query string", () => {
    expect(parseQuery("")).toEqual({});
  });
});

describe("Router", () => {
  it("resolves by method and path", () => {
    const router = new Router();
    router.get("/v1/orders/:id", () => "handler");
    const match = router.resolve("GET", "/v1/orders/ord_9");
    expect(match.params).toEqual({ id: "ord_9" });
    expect(match.route.handler()).toBe("handler");
  });

  it("does not resolve the wrong method", () => {
    const router = new Router();
    router.get("/v1/orders", () => "handler");
    expect(router.resolve("POST", "/v1/orders")).toBeNull();
  });

  it("lists its routes", () => {
    const router = new Router();
    router.get("/health", () => {});
    router.post("/v1/checkout", () => {});
    expect(router.list()).toEqual(["GET /health", "POST /v1/checkout"]);
  });
});
