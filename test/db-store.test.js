import { describe, it, expect, beforeEach } from "vitest";
import { truncateAll, put, get, patch, remove, all, count, table } from "../src/db/store.js";

describe("store", () => {
  beforeEach(() => truncateAll());

  it("stores and reads a row", () => {
    put("customers", { id: "cus_1", email: "a@b.test" });
    expect(get("customers", "cus_1").email).toBe("a@b.test");
  });

  it("copies rows in so callers cannot mutate stored state", () => {
    const row = { id: "cus_1", email: "a@b.test" };
    put("customers", row);
    row.email = "changed@b.test";
    expect(get("customers", "cus_1").email).toBe("a@b.test");
  });

  it("refuses a row without an id", () => {
    expect(() => put("customers", { email: "a@b.test" })).toThrow(/without an id/);
  });

  it("refuses an unknown table", () => {
    expect(() => table("unicorns")).toThrow(/unknown table/);
  });

  it("patches an existing row", () => {
    put("orders", { id: "ord_1", status: "pending" });
    expect(patch("orders", "ord_1", { status: "paid" }).status).toBe("paid");
  });

  it("throws a 404 when patching a row that is not there", () => {
    try {
      patch("orders", "missing", { status: "paid" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err.statusCode).toBe(404);
    }
  });

  it("removes rows and counts what is left", () => {
    put("orders", { id: "ord_1" });
    put("orders", { id: "ord_2" });
    expect(count("orders")).toBe(2);
    expect(remove("orders", "ord_1")).toBe(true);
    expect(all("orders").map((row) => row.id)).toEqual(["ord_2"]);
  });
});
