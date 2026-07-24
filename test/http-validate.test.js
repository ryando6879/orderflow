import { describe, it, expect } from "vitest";
import { matchesType, validateBody } from "../src/http/middleware/validate.js";

describe("type checks", () => {
  it("recognises the types it supports", () => {
    expect(matchesType("a", "string")).toBe(true);
    expect(matchesType(1, "number")).toBe(true);
    expect(matchesType(true, "boolean")).toBe(true);
    expect(matchesType([], "array")).toBe(true);
    expect(matchesType({}, "object")).toBe(true);
  });

  it("rejects the wrong type", () => {
    expect(matchesType("1", "number")).toBe(false);
    expect(matchesType(Number.NaN, "number")).toBe(false);
    expect(matchesType([], "object")).toBe(false);
    expect(matchesType(null, "object")).toBe(false);
  });
});

describe("validateBody", () => {
  it("accepts a well-formed body", () => {
    const result = validateBody(
      { cartId: "cart_1", qty: 2 },
      { cartId: "string", qty: "number" }
    );
    expect(result.valid).toBe(true);
    expect(result.value).toEqual({ cartId: "cart_1", qty: 2 });
  });

  it("drops fields the schema does not mention", () => {
    const result = validateBody({ cartId: "cart_1", junk: "x" }, { cartId: "string" });
    expect(result.value).toEqual({ cartId: "cart_1" });
  });

  it("reports a missing required field", () => {
    const result = validateBody({}, { cartId: "string" });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["cartId is required"]);
  });

  it("reports a field of the wrong type", () => {
    const result = validateBody({ qty: "two" }, { qty: "number" });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(["qty must be a number"]);
  });

  it("allows an absent optional field", () => {
    const result = validateBody({ cartId: "cart_1" }, { cartId: "string", note: "string?" });
    expect(result.valid).toBe(true);
    expect(result.value.note).toBeUndefined();
  });

  it("collects every error", () => {
    const result = validateBody({ qty: "two" }, { cartId: "string", qty: "number" });
    expect(result.errors.length).toBe(2);
  });
});
