import { describe, it, expect } from "vitest";
import { pageRequest, totalPages, paginate, DEFAULT_LIMIT, MAX_LIMIT } from "../src/lib/pagination.js";

describe("pagination", () => {
  it("defaults a missing page and limit", () => {
    expect(pageRequest({})).toEqual({ page: 1, limit: DEFAULT_LIMIT });
  });

  it("parses page and limit from query strings", () => {
    expect(pageRequest({ page: "3", limit: "10" })).toEqual({ page: 3, limit: 10 });
  });

  it("clamps a hostile limit", () => {
    expect(pageRequest({ limit: "5000" }).limit).toBe(MAX_LIMIT);
    expect(pageRequest({ limit: "-4" }).limit).toBe(1);
  });

  it("never returns a page below one", () => {
    expect(pageRequest({ page: "0" }).page).toBe(1);
    expect(pageRequest({ page: "-7" }).page).toBe(1);
  });

  it("counts pages", () => {
    expect(totalPages(0, 25)).toBe(0);
    expect(totalPages(25, 25)).toBe(1);
    expect(totalPages(26, 25)).toBe(2);
  });

  it("describes the page it returned", () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));
    const result = paginate(rows, { page: 1, limit: 3 });
    expect(result.total).toBe(7);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
  });

  it("reports no next page on the last page", () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ id: i }));
    expect(paginate(rows, { page: 3, limit: 3 }).hasNextPage).toBe(false);
  });
});
