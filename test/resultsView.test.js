import { describe, it, expect } from "vitest";
import { createResultsView } from "../src/resultsView.js";

describe("results view", () => {
  it("paints the first response", () => {
    const view = createResultsView();
    view.render([{ sku: "MUG-1", name: "Coffee Mug" }], "mug");
    expect(view.state()).toEqual({ query: "mug", rows: ["Coffee Mug"] });
  });

  it("repaints when the result set grows", () => {
    const view = createResultsView();
    view.render([{ sku: "MUG-1", name: "Coffee Mug" }], "mug");
    view.render(
      [
        { sku: "TEE-1", name: "Logo Tee" },
        { sku: "HAT-1", name: "Trucker Hat" },
      ],
      "t"
    );
    expect(view.state().rows).toEqual(["Logo Tee", "Trucker Hat"]);
  });
});
