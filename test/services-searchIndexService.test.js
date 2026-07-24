import { describe, it, expect } from "vitest";
import { tokenize, search, stats, rebuild } from "../src/services/searchIndexService.js";

describe("tokenizing", () => {
  it("lowercases and splits on punctuation", () => {
    expect(tokenize("Coffee Mug")).toEqual(["coffee", "mug"]);
  });

  it("drops stop words and single characters", () => {
    expect(tokenize("the Trucker Hat")).toEqual(["trucker", "hat"]);
  });
});

describe("search", () => {
  it("finds a product by a word in its name", () => {
    expect(search("mug")).toEqual(["MUG-1"]);
  });

  it("finds a product by a prefix", () => {
    expect(search("truck")).toEqual(["HAT-1"]);
  });

  it("narrows the result set with extra words", () => {
    expect(search("coffee mug")).toEqual(["MUG-1"]);
  });

  it("returns nothing for an empty query", () => {
    expect(search("")).toEqual([]);
  });

  it("returns nothing for a word we do not stock", () => {
    expect(search("bicycle")).toEqual([]);
  });
});

describe("index maintenance", () => {
  it("rebuilds and reports its size", () => {
    expect(rebuild()).toBeGreaterThan(0);
    expect(stats().skus).toBe(4);
  });
});
