import { describe, it, expect } from "vitest";
import { renderLandingPage, handleSignIn } from "../src/landing.js";

describe("landing page", () => {
  it("renders the sign-in form", () => {
    const html = renderLandingPage();
    expect(html).toContain('<button type="submit">Sign in</button>');
    expect(html).not.toContain("error");
  });

  it("redirects home after a successful sign-in", async () => {
    const result = await handleSignIn("ryan@example.com", "orderflow-demo");
    expect(result.redirectTo).toBe("/");
    expect(result.session.name).toBe("Ryan");
  });
});
