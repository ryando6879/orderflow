import { describe, it, expect } from "vitest";
import { createSearchPage } from "../src/searchPage.js";

describe("search page", () => {
  it("wires the box to the view for a settled search", async () => {
    const { box, view } = createSearchPage();
    await box.type("tee");
    expect(view.state().rows).toEqual(["Logo Tee"]);
  });
});
