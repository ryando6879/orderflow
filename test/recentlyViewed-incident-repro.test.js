import { describe, it, expect } from "vitest";
import { recordView, MAX_RECENT } from "../src/recentlyViewed.js";

describe("recently viewed incident reproduction", () => {
  it("moves a re-viewed product to the front instead of duplicating it", () => {
    // Shopper views TEE-1, then MUG-1, then views TEE-1 again.
    // TEE-1 should move to the front, not appear twice.
    let list = [];
    list = recordView(list, "TEE-1");
    list = recordView(list, "MUG-1");
    list = recordView(list, "TEE-1");
    
    // TEE-1 should be first (most recent), MUG-1 second, and TEE-1 should appear only once
    expect(list).toEqual(["TEE-1", "MUG-1"]);
    expect(list.length).toBe(2);
  });

  it("updates the list when viewing new products after reaching MAX_RECENT", () => {
    // Shopper views products until the list is full, then views more.
    // The newest products should appear in the list, oldest should fall off.
    let list = [];
    list = recordView(list, "TEE-1");
    list = recordView(list, "MUG-1");
    list = recordView(list, "HAT-1");
    list = recordView(list, "STK-1");
    
    // List is now full with 4 items (MAX_RECENT)
    expect(list.length).toBe(MAX_RECENT);
    
    // View a new product - it should appear at the front, oldest (TEE-1) should fall off
    list = recordView(list, "POSTER-1");
    
    // POSTER-1 should be first (newest), TEE-1 should be gone (oldest)
    expect(list[0]).toBe("POSTER-1");
    expect(list).not.toContain("TEE-1");
    expect(list.length).toBe(MAX_RECENT);
  });

  it("maintains newest-first order with no duplicates through multiple re-views", () => {
    // Reproduce the exact scenario from the inline demo at lines 26-31:
    // shopper browses five products, going back to MUG-1 once in between
    const views = ["TEE-1", "MUG-1", "HAT-1", "STK-1", "MUG-1", "POSTER-1"];
    let list = [];
    for (const sku of views) {
      list = recordView(list, sku);
    }
    
    // Should show the 4 most recent DISTINCT products, newest first:
    // POSTER-1 (last viewed), MUG-1 (re-viewed 5th), STK-1 (4th), HAT-1 (3rd)
    // TEE-1 should have fallen off (was 1st, oldest of the 5 distinct products)
    expect(list).toEqual(["POSTER-1", "MUG-1", "STK-1", "HAT-1"]);
    expect(list.length).toBe(MAX_RECENT);
    
    // Verify no duplicates
    const uniqueSkus = new Set(list);
    expect(uniqueSkus.size).toBe(list.length);
  });
});
