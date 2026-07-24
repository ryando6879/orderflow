import { describe, it, expect } from "vitest";
import { TtlCache, memoize } from "../src/lib/cache.js";

describe("TtlCache", () => {
  it("stores and returns a value", () => {
    const cache = new TtlCache({ ttlMs: 1000 });
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("misses on an unknown key", () => {
    expect(new TtlCache().get("nope")).toBeUndefined();
  });

  it("expires entries whose ttl has passed", () => {
    const cache = new TtlCache({ ttlMs: -1 });
    cache.set("a", 1);
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entry when full", () => {
    const cache = new TtlCache({ maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("deletes and clears", () => {
    const cache = new TtlCache();
    cache.set("a", 1);
    expect(cache.delete("a")).toBe(true);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe("memoize", () => {
  it("calls the wrapped function once per key", () => {
    let calls = 0;
    const double = memoize((n) => {
      calls += 1;
      return n * 2;
    });
    expect(double(4)).toBe(8);
    expect(double(4)).toBe(8);
    expect(calls).toBe(1);
  });

  it("recomputes for a different argument", () => {
    let calls = 0;
    const double = memoize((n) => {
      calls += 1;
      return n * 2;
    });
    double(1);
    double(2);
    expect(calls).toBe(2);
  });
});
