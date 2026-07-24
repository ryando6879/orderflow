import { describe, it, expect } from "vitest";
import { filterBy, orderBy, whereIn, since, groupBy } from "../src/db/query.js";

const ROWS = [
  { id: "a", status: "paid", region: "us", placedAt: "2026-07-01T00:00:00.000Z", total: 300 },
  { id: "b", status: "pending", region: "us", placedAt: "2026-07-05T00:00:00.000Z", total: 100 },
  { id: "c", status: "paid", region: "eu", placedAt: "2026-07-03T00:00:00.000Z", total: 200 },
];

describe("filterBy", () => {
  it("matches on one field", () => {
    expect(filterBy(ROWS, { status: "paid" }).map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("matches on several fields", () => {
    expect(filterBy(ROWS, { status: "paid", region: "us" }).map((r) => r.id)).toEqual(["a"]);
  });

  it("ignores undefined filters", () => {
    expect(filterBy(ROWS, { status: undefined }).length).toBe(3);
  });
});

describe("orderBy", () => {
  it("sorts ascending", () => {
    expect(orderBy(ROWS, "total").map((r) => r.total)).toEqual([100, 200, 300]);
  });

  it("sorts descending", () => {
    expect(orderBy(ROWS, "placedAt", "desc").map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input", () => {
    orderBy(ROWS, "total", "desc");
    expect(ROWS.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
});

describe("whereIn / since / groupBy", () => {
  it("keeps rows whose field is in the set", () => {
    expect(whereIn(ROWS, "status", ["pending"]).map((r) => r.id)).toEqual(["b"]);
  });

  it("keeps rows at or after a timestamp", () => {
    expect(since(ROWS, "placedAt", "2026-07-03T00:00:00.000Z").map((r) => r.id)).toEqual(["b", "c"]);
  });

  it("groups rows by a field", () => {
    const groups = groupBy(ROWS, "region");
    expect([...groups.keys()].sort()).toEqual(["eu", "us"]);
    expect(groups.get("us").length).toBe(2);
  });
});
