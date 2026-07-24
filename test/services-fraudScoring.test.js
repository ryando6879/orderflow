import { describe, it, expect } from "vitest";
import { score, decide, unknownSignals } from "../src/services/fraudScoring.js";

describe("fraud score", () => {
  it("scores a clean order at zero", () => {
    expect(score([])).toBe(0);
  });

  it("adds up risk signals", () => {
    expect(score(["email_domain_disposable", "many_cards_one_account"])).toBe(70);
  });

  it("clamps at 100", () => {
    expect(
      score([
        "email_domain_disposable",
        "many_cards_one_account",
        "mismatched_billing_country",
        "first_order_high_value",
      ])
    ).toBe(100);
  });
});

describe("decisions", () => {
  it("allows an order with no signals", () => {
    expect(decide([]).decision).toBe("allow");
  });

  it("holds an order in the review band", () => {
    const verdict = decide(["email_domain_disposable", "many_cards_one_account"]);
    expect(verdict.score).toBe(70);
    expect(verdict.decision).toBe("review");
  });

  it("blocks an order in the block band", () => {
    const verdict = decide([
      "email_domain_disposable",
      "many_cards_one_account",
      "first_order_high_value",
    ]);
    expect(verdict.score).toBe(95);
    expect(verdict.decision).toBe("block");
  });
});

describe("signal hygiene", () => {
  it("reports signal names we do not know", () => {
    expect(unknownSignals(["email_domain_disposable", "wat"])).toEqual(["wat"]);
  });
});
