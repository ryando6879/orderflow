import { describe, it, expect } from "vitest";
import { canTransition, isTerminal, transition, ALL_STATES } from "../src/domain/orderStates.js";

describe("order state machine", () => {
  it("knows every state", () => {
    expect(ALL_STATES).toContain("pending");
    expect(ALL_STATES).toContain("partially_refunded");
  });

  it("allows the happy path", () => {
    expect(canTransition("pending", "paid")).toBe(true);
    expect(canTransition("paid", "fulfilled")).toBe(true);
    expect(canTransition("fulfilled", "closed")).toBe(true);
  });

  it("allows a partial refund after fulfilment", () => {
    expect(canTransition("fulfilled", "partially_refunded")).toBe(true);
    expect(canTransition("partially_refunded", "refunded")).toBe(true);
  });

  it("rejects moves out of a terminal state", () => {
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("closed")).toBe(true);
    expect(canTransition("cancelled", "paid")).toBe(false);
  });

  it("rejects an unknown state", () => {
    expect(canTransition("banana", "paid")).toBe(false);
  });

  it("moves an order", () => {
    expect(transition({ id: "ord_1", status: "pending" }, "paid")).toEqual({ id: "ord_1", status: "paid" });
  });

  it("throws a 409 on an illegal move", () => {
    try {
      transition({ id: "ord_1", status: "closed" }, "paid");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err.code).toBe("invalid_transition");
      expect(err.statusCode).toBe(409);
    }
  });
});
