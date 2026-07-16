import { describe, it, expect } from "vitest";
import { recordView, MAX_RECENT } from "../src/recentlyViewed.js";

describe("recently viewed strip", () => {
  it("shows the first product a shopper opens", () => {
    expect(recordView([], "TEE-1")).toEqual(["TEE-1"]);
  });

  it("never grows past the strip size", () => {
    let list = [];
    for (const sku of ["A-1", "B-1", "C-1", "D-1", "E-1"]) {
      list = recordView(list, sku);
    }
    expect(list).toHaveLength(MAX_RECENT);
  });

  it("does not modify the list it was given", () => {
    const list = ["TEE-1"];
    recordView(list, "MUG-1");
    expect(list).toEqual(["TEE-1"]);
  });
});
