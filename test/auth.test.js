import { describe, it, expect } from "vitest";
import { findUser, signIn } from "../src/auth.js";

describe("auth", () => {
  it("finds a registered customer by email", () => {
    expect(findUser("ryan@example.com")).toMatchObject({ name: "Ryan" });
    expect(findUser("nobody@example.com")).toBeNull();
  });

  it("signs a customer in with the right password", async () => {
    const session = await signIn("ryan@example.com", "orderflow-demo");
    expect(session.email).toBe("ryan@example.com");
    expect(session.sessionId).toMatch(/^SES-/);
  });
});
