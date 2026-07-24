import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { cutoffFor, run } from "../src/jobs/abandonedCartSweep.js";
import { config } from "../src/config/index.js";

describe("the quiet period", () => {
  it("puts the cutoff a quiet period behind now", () => {
    const nowMs = Date.parse("2026-07-20T12:00:00.000Z");
    const expected = new Date(nowMs - config.jobs.abandonedCartAfterMinutes * 60_000).toISOString();
    expect(cutoffFor(nowMs)).toBe(expected);
  });
});

describe("the sweep", () => {
  beforeEach(() => resetStore());

  it("does nothing when there are no open carts", async () => {
    await expect(run({ nowMs: Date.parse("2026-07-20T12:00:00.000Z") })).resolves.toEqual({
      considered: 0,
      nudged: 0,
      skipped: 0,
    });
  });
});
