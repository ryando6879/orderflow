import { describe, it, expect } from "vitest";
import { weightOf, knownSignals, trustSignals, REVIEW_AT, BLOCK_AT } from "../src/domain/riskSignals.js";

describe("signal weights", () => {
  it("gives risk signals a positive weight", () => {
    expect(weightOf("email_domain_disposable")).toBe(40);
  });

  it("gives trust signals a negative weight", () => {
    expect(weightOf("repeat_customer_in_good_standing")).toBe(-30);
    expect(weightOf("account_older_than_year")).toBeLessThan(0);
  });

  it("gives an unknown signal no weight", () => {
    expect(weightOf("not_a_signal")).toBe(0);
  });
});

describe("the signal catalog", () => {
  it("lists every signal", () => {
    expect(knownSignals()).toContain("shipping_to_freight_forwarder");
    expect(knownSignals().length).toBeGreaterThan(5);
  });

  it("picks out the trust signals in a set", () => {
    expect(trustSignals(["email_domain_disposable", "account_older_than_year"])).toEqual([
      "account_older_than_year",
    ]);
  });
});

describe("score bands", () => {
  it("reviews before it blocks", () => {
    expect(REVIEW_AT).toBeLessThan(BLOCK_AT);
  });
});
