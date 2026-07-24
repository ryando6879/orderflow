import { describe, it, expect } from "vitest";
import {
  parseIso,
  formatIso,
  startOfDayUtc,
  addDays,
  daysBetween,
  isWeekend,
  daysInMonth,
} from "../src/lib/dates.js";

describe("date helpers", () => {
  it("parses and reformats an ISO timestamp", () => {
    expect(formatIso("2026-07-14T09:30:00.000Z")).toBe("2026-07-14T09:30:00.000Z");
  });

  it("rejects a value that is not a timestamp", () => {
    expect(() => parseIso("not-a-date")).toThrow(/ISO-8601/);
  });

  it("truncates to midnight UTC", () => {
    expect(formatIso(startOfDayUtc("2026-07-14T23:59:59.000Z"))).toBe("2026-07-14T00:00:00.000Z");
  });

  it("shifts by whole days in both directions", () => {
    expect(formatIso(addDays("2026-07-14T00:00:00.000Z", 3))).toBe("2026-07-17T00:00:00.000Z");
    expect(formatIso(addDays("2026-07-14T00:00:00.000Z", -1))).toBe("2026-07-13T00:00:00.000Z");
  });

  it("counts whole days between two timestamps", () => {
    expect(daysBetween("2026-07-01T22:00:00.000Z", "2026-07-08T01:00:00.000Z")).toBe(7);
  });

  it("knows the weekend", () => {
    expect(isWeekend("2026-07-18T12:00:00.000Z")).toBe(true);
    expect(isWeekend("2026-07-19T12:00:00.000Z")).toBe(true);
    expect(isWeekend("2026-07-17T12:00:00.000Z")).toBe(false);
  });

  it("counts days in a month", () => {
    expect(daysInMonth("2026-02-10T00:00:00.000Z")).toBe(28);
    expect(daysInMonth("2026-07-10T00:00:00.000Z")).toBe(31);
  });
});
