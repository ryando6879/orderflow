import { describe, it, expect } from "vitest";
import { allocate } from "../src/domain/money.js";

describe("allocate", () => {
  it("distributes remainder cents so the parts sum exactly to total", () => {
    // The reported case: splitting $10.00 (1000 cents) across items priced at $19, $14, $6
    // Proportional floor gives [487, 358, 153] = 998, losing 2 cents
    // Contract requires the parts sum to EXACTLY 1000
    const parts = allocate(1000, [19, 14, 6]);
    
    // The sum must equal the input total exactly
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(1000);
    
    // Each part must be a non-negative integer (cents)
    parts.forEach(part => {
      expect(Number.isInteger(part)).toBe(true);
      expect(part).toBeGreaterThanOrEqual(0);
    });
  });

  it("distributes remainder cents for another uneven split", () => {
    // Another case that doesn't divide evenly
    const parts = allocate(100, [7, 5, 3]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(100);
  });

  it("returns exact parts when division is even", () => {
    // Case that divides evenly should still sum exactly
    const parts = allocate(1000, [50, 30, 20]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(1000);
  });
});
