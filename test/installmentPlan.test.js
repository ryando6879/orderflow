import { describe, it, expect } from "vitest";
import { buildInstallmentPlan } from "../src/installmentPlan.js";

describe("pay-in-4 checkout plan", () => {
  it("returns one scheduled entry per installment", () => {
    const plan = buildInstallmentPlan({ placedAt: "2026-03-06", totalCents: 4000 }, 4);
    expect(plan.installments).toHaveLength(4);
    expect(plan.installments[0]).toHaveProperty("amountCents");
    expect(plan.installments[0]).toHaveProperty("dueDate");
  });

  it("charges an equal share today on an evenly divisible order", () => {
    const plan = buildInstallmentPlan({ placedAt: "2026-03-06", totalCents: 4000 }, 4);
    expect(plan.dueTodayCents).toBe(1000);
  });
});
