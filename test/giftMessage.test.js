import { describe, it, expect } from "vitest";
import { giftCardText } from "../src/giftMessage.js";

describe("gift message card", () => {
  it("trims the customer's message", () => {
    expect(
      giftCardText({ id: "ORD-1", giftMessage: "  Happy birthday, Maya!  " })
    ).toBe("Happy birthday, Maya!");
  });

  it("keeps the message text intact", () => {
    expect(giftCardText({ id: "ORD-2", giftMessage: "Enjoy!" })).toBe("Enjoy!");
  });
});
