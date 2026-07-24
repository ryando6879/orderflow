import { describe, it, expect } from "vitest";
import { splitInstallments } from "../src/installments.js";

describe("pay-in-4 installment amounts", () => {
  it("splits an evenly divisible total into equal installments", () => {
    expect(splitInstallments(4000, 4)).toEqual([1000, 1000, 1000, 1000]);
  });

  it("returns one amount per installment", () => {
    expect(splitInstallments(6000, 3)).toHaveLength(3);
  });
});
