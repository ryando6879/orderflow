import { describe, it, expect } from "vitest";
import { isBusinessDay, nextBusinessDay } from "../src/businessDays.js";
import { dispatchDate } from "../src/dispatch.js";
import { allocateOrder } from "../src/allocation.js";

describe("Saturday ship-out incident reproduction", () => {
  it("isBusinessDay must reject Saturday (day 6) as a non-business day", () => {
    // Saturday 2026-03-14
    const saturday = "2026-03-14";
    expect(isBusinessDay(saturday)).toBe(false);
  });

  it("isBusinessDay must reject Sunday (day 0) as a non-business day", () => {
    // Sunday 2026-03-15
    const sunday = "2026-03-15";
    expect(isBusinessDay(sunday)).toBe(false);
  });

  it("isBusinessDay must accept Monday through Friday as business days", () => {
    // Monday 2026-03-09 through Friday 2026-03-13
    expect(isBusinessDay("2026-03-09")).toBe(true);
    expect(isBusinessDay("2026-03-10")).toBe(true);
    expect(isBusinessDay("2026-03-11")).toBe(true);
    expect(isBusinessDay("2026-03-12")).toBe(true);
    expect(isBusinessDay("2026-03-13")).toBe(true);
  });

  it("nextBusinessDay from Friday must skip Saturday and Sunday to reach Monday", () => {
    // Friday 2026-03-13 -> Monday 2026-03-16
    const friday = "2026-03-13";
    expect(nextBusinessDay(friday)).toBe("2026-03-16");
  });

  it("dispatchDate for after-cutoff Friday order must dispatch on Monday, not Saturday", () => {
    // Friday afternoon 2026-03-13 at 16:00 UTC, after 15:00 cutoff
    const fridayAfternoon = "2026-03-13T16:00:00Z";
    const dispatch = dispatchDate(fridayAfternoon, { cutoffHour: 15 });
    // Must dispatch Monday 2026-03-16, not Saturday 2026-03-14
    expect(dispatch).toBe("2026-03-16");
  });

  it("dispatchDate for Saturday order must dispatch on Monday", () => {
    // Saturday morning 2026-03-14 at 10:00 UTC
    const saturdayMorning = "2026-03-14T10:00:00Z";
    const dispatch = dispatchDate(saturdayMorning, { cutoffHour: 15 });
    // Must dispatch Monday 2026-03-16
    expect(dispatch).toBe("2026-03-16");
  });

  it("allocateOrder must ship from single warehouse when one stocks all items", () => {
    // West warehouse stocks TEE-1:25 and MUG-1:30, so it can fulfill both
    const lines = [
      { sku: "TEE-1", qty: 2 },
      { sku: "MUG-1", qty: 1 }
    ];
    const shipments = allocateOrder(lines, "west");
    // Must be single shipment from west-1
    expect(shipments).toHaveLength(1);
    expect(shipments[0].warehouseId).toBe("west-1");
    expect(shipments[0].lines).toHaveLength(2);
  });

  it("allocateOrder must prefer closer warehouse when multiple can fulfill entire order", () => {
    // Both warehouses stock TEE-1 (east:40, west:25)
    // For west destination, west-1 has 1 transit day vs east-1's 4 days
    const lines = [{ sku: "TEE-1", qty: 2 }];
    const shipments = allocateOrder(lines, "west");
    expect(shipments).toHaveLength(1);
    expect(shipments[0].warehouseId).toBe("west-1");
  });
});
