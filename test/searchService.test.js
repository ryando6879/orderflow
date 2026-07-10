import { describe, it, expect } from "vitest";
import { searchProducts, searchLatency } from "../src/searchService.js";

describe("product search", () => {
  it("finds products by name, case-insensitively", async () => {
    const results = await searchProducts("MUG");
    expect(results).toEqual([{ sku: "MUG-1", name: "Coffee Mug", price: 1200 }]);
  });

  it("returns every match for a broad query", async () => {
    const results = await searchProducts("t");
    expect(results.map((product) => product.sku)).toEqual(["TEE-1", "HAT-1", "STK-1"]);
  });

  it("resolves empty when nothing matches", async () => {
    expect(await searchProducts("boots")).toEqual([]);
  });

  it("gives broad queries a longer simulated latency", () => {
    expect(searchLatency("t")).toBeGreaterThan(searchLatency("tee"));
  });
});
