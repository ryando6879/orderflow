import { describe, it, expect } from "vitest";
import { backoffMs, withRetry } from "../src/lib/retry.js";

describe("backoff", () => {
  it("doubles each attempt", () => {
    expect(backoffMs(1, { baseMs: 100 })).toBe(100);
    expect(backoffMs(2, { baseMs: 100 })).toBe(200);
    expect(backoffMs(3, { baseMs: 100 })).toBe(400);
  });

  it("caps at maxMs", () => {
    expect(backoffMs(20, { baseMs: 100, maxMs: 1000 })).toBe(1000);
  });
});

describe("withRetry", () => {
  const noSleep = async () => {};

  it("returns the first successful result", async () => {
    const result = await withRetry(async () => "ok", { sleep: noSleep });
    expect(result).toBe("ok");
  });

  it("retries a failing task until it succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("boom");
        return attempts;
      },
      { attempts: 5, sleep: noSleep }
    );
    expect(result).toBe(3);
  });

  it("gives up after the attempt budget", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("always fails");
        },
        { attempts: 2, sleep: noSleep }
      )
    ).rejects.toThrow("always fails");
    expect(attempts).toBe(2);
  });

  it("does not retry when the caller says the error is fatal", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("fatal");
        },
        { attempts: 4, sleep: noSleep, isRetryable: () => false }
      )
    ).rejects.toThrow("fatal");
    expect(attempts).toBe(1);
  });
});
