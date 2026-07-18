import { describe, it, expect } from "vitest";
import { miniCartLabel } from "../src/miniCart.js";
import { addItem } from "../src/cartSession.js";

describe("cart session isolation", () => {
  it("brand-new sessions must not see items from other sessions' carts", () => {
    const sessions = new Map();

    // Shopper A arrives and adds items to their cart
    addItem(sessions, "sess-1042", "TEE-1", 2);
    addItem(sessions, "sess-1042", "MUG-1", 1);

    // Verify shopper A sees their own items
    expect(miniCartLabel(sessions, "sess-1042")).toBe("Your cart: TEE-1 x2, MUG-1 x1");

    // Shopper B arrives as a brand-new visitor (different session, never seen before)
    // They should see an empty cart, NOT shopper A's items
    expect(miniCartLabel(sessions, "sess-2077")).toBe("Your cart is empty");

    // Shopper C also arrives as a brand-new visitor
    // They should also see an empty cart, NOT shopper A's items
    expect(miniCartLabel(sessions, "sess-3001")).toBe("Your cart is empty");

    // Verify shopper A's cart is still intact and isolated
    expect(miniCartLabel(sessions, "sess-1042")).toBe("Your cart: TEE-1 x2, MUG-1 x1");

    // Shopper B adds their own items
    addItem(sessions, "sess-2077", "HAT-1", 1);

    // Verify shopper B sees only their own items
    expect(miniCartLabel(sessions, "sess-2077")).toBe("Your cart: HAT-1 x1");

    // Verify shopper C still sees an empty cart (not affected by B's addition)
    expect(miniCartLabel(sessions, "sess-3001")).toBe("Your cart is empty");

    // Verify shopper A's cart remains unchanged
    expect(miniCartLabel(sessions, "sess-1042")).toBe("Your cart: TEE-1 x2, MUG-1 x1");
  });
});
