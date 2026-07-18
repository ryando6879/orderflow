import { describe, it, expect } from "vitest";
import { miniCartLabel } from "../src/miniCart.js";
import { addItem } from "../src/cartSession.js";

describe("mini-cart widget", () => {
  it("renders a session's cart from empty through adding items", () => {
    const sessions = new Map();

    expect(miniCartLabel(sessions, "sess-12")).toBe("Your cart is empty");

    addItem(sessions, "sess-12", "HAT-1", 1);
    expect(miniCartLabel(sessions, "sess-12")).toBe("Your cart: HAT-1 x1");

    addItem(sessions, "sess-12", "STK-1", 3);
    expect(miniCartLabel(sessions, "sess-12")).toBe(
      "Your cart: HAT-1 x1, STK-1 x3"
    );
  });
});
