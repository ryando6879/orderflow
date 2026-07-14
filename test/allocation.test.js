import { describe, it, expect } from "vitest";
import { allocateOrder } from "../src/allocation.js";

describe("order allocation", () => {
  it("ships stickers from the east warehouse that stocks them", () => {
    const shipments = allocateOrder([{ sku: "STK-1", qty: 2 }], "east");
    expect(shipments).toHaveLength(1);
    expect(shipments[0].warehouseId).toBe("east-1");
  });

  it("ships hats from the west warehouse that stocks them", () => {
    const shipments = allocateOrder([{ sku: "HAT-1", qty: 1 }], "west");
    expect(shipments).toHaveLength(1);
    expect(shipments[0].warehouseId).toBe("west-1");
    expect(shipments[0].lines).toEqual([{ sku: "HAT-1", qty: 1 }]);
  });
});
