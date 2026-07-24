import { describe, it, expect, beforeEach } from "vitest";
import { resetStore } from "../src/db/reset.js";
import { applyOnce, markApplied, byId, all } from "../src/repositories/webhookEventRepo.js";

describe("webhook event ledger", () => {
  beforeEach(() => resetStore());

  it("applies an event the first time it is delivered", async () => {
    let applications = 0;
    const result = await applyOnce({ id: "evt_1", type: "charge.succeeded", orderId: "ord_1" }, async () => {
      applications += 1;
      return "done";
    });
    expect(result.applied).toBe(true);
    expect(applications).toBe(1);
  });

  it("ignores a redelivery of the same event", async () => {
    const event = { id: "evt_1", type: "charge.succeeded", orderId: "ord_1" };
    let applications = 0;
    const handler = async () => {
      applications += 1;
    };
    await applyOnce(event, handler);
    const replay = await applyOnce(event, handler);
    expect(replay.applied).toBe(false);
    expect(applications).toBe(1);
  });

  it("records when an event was applied", () => {
    markApplied({ id: "evt_9", type: "shipment.updated", orderId: "ord_2" });
    expect(byId("evt_9").appliedAt).toBeTypeOf("string");
    expect(all().length).toBe(1);
  });
});
