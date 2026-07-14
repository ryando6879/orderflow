import { describe, it, expect } from "vitest";
import { dispatchDate } from "../src/dispatch.js";

describe("dispatch date", () => {
  it("dispatches same day when the order beats the cutoff", () => {
    // Tuesday morning, cutoff mid-afternoon.
    const dispatch = dispatchDate("2026-03-10T10:00:00Z", { cutoffHour: 15 });
    expect(dispatch).toBe("2026-03-10");
  });

  it("dispatches same day exactly at the cutoff hour", () => {
    const dispatch = dispatchDate("2026-03-10T15:45:00Z", { cutoffHour: 15 });
    expect(dispatch).toBe("2026-03-10");
  });
});
