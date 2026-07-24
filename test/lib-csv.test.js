import { describe, it, expect } from "vitest";
import { renderCell, toCsv, ROW_SEPARATOR } from "../src/lib/csv.js";

describe("csv cells", () => {
  it("leaves a plain value alone", () => {
    expect(renderCell("ORD-1234")).toBe("ORD-1234");
  });

  it("quotes a value containing a comma", () => {
    expect(renderCell("Austin, TX")).toBe('"Austin, TX"');
  });

  it("doubles inner quotes", () => {
    expect(renderCell('the "good" mug')).toBe('"the ""good"" mug"');
  });

  it("quotes a value containing a newline", () => {
    expect(renderCell("line one\nline two")).toBe('"line one\nline two"');
  });
});

describe("csv documents", () => {
  it("writes a header and rows with CRLF endings", () => {
    const csv = toCsv(["number", "city"], [
      { number: "ORD-1", city: "Austin" },
      { number: "ORD-2", city: "Reno" },
    ]);
    expect(csv).toBe(
      `number,city${ROW_SEPARATOR}ORD-1,Austin${ROW_SEPARATOR}ORD-2,Reno${ROW_SEPARATOR}`
    );
  });

  it("writes just a header for an empty result", () => {
    expect(toCsv(["number"], [])).toBe(`number${ROW_SEPARATOR}`);
  });
});
