import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { hasRetriesLeft, SCHEDULE_DAYS, run } from "../src/jobs/dunningRun.js";
import { config } from "../src/config/index.js";

describe("retry budget", () => {
  it("has a retry for a subscription that has not been tried", () => {
    expect(hasRetriesLeft({ dunningAttempts: 0 })).toBe(true);
    expect(hasRetriesLeft({})).toBe(true);
  });

  it("has no retry left once the budget is spent", () => {
    expect(hasRetriesLeft({ dunningAttempts: config.jobs.dunningMaxAttempts })).toBe(false);
  });

  it("spaces retries further apart each time", () => {
    expect(SCHEDULE_DAYS).toEqual([1, 3, 5, 7]);
    expect(SCHEDULE_DAYS.length).toBe(config.jobs.dunningMaxAttempts);
  });
});

describe("the dunning pass", () => {
  beforeEach(() => resetStore());

  it("does nothing when no subscription is past due", async () => {
    await expect(run({ nowIso: "2026-07-20T00:00:00.000Z" })).resolves.toEqual({
      considered: 0,
      retried: 0,
      recovered: 0,
      cancelled: 0,
    });
  });
});
