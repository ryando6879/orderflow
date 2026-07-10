import { describe, it, expect } from "vitest";
import { createSearchBox } from "../src/searchBox.js";
import { createResultsView } from "../src/resultsView.js";

describe("search box", () => {
  it("tracks what the customer typed", async () => {
    const box = createSearchBox(createResultsView());
    const pending = box.type("ha");
    expect(box.query()).toBe("ha");
    await pending;
  });

  it("renders the response for a settled search", async () => {
    const view = createResultsView();
    const box = createSearchBox(view);
    await box.type("hat");
    expect(view.state()).toEqual({ query: "hat", rows: ["Trucker Hat"] });
  });
});
