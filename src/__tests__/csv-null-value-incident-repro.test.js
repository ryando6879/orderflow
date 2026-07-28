import { describe, it, expect } from "vitest";
import { toCsv } from "../lib/csv.js";

// Reproduces the month-end order export crash when orders contain null/undefined
// optional fields (couponCode, trackingNumber, etc.). The bug: renderCell() calls
// value.includes() before checking for null/undefined, causing TypeError.
// When the date range has no orders, only the header row (all strings) is processed,
// so no crash. When real orders are present, at least one has a missing optional field.

describe("toCsv with null/undefined cell values", () => {
  it("renders order export CSV with missing couponCode and trackingNumber as empty cells", () => {
    // Columns match ORDER_EXPORT_COLUMNS from reportingService.js:67-80
    const columns = [
      "number",
      "placedAt",
      "status",
      "region",
      "service",
      "couponCode",
      "trackingNumber",
      "merchandise",
      "discount",
      "tax",
      "shipping",
      "total",
    ];

    // Real order data shape from orderRepo.js:4-7, with null optional fields
    // that trigger the crash (couponCode, trackingNumber not present on all orders)
    const rows = [
      {
        number: "ORD-7K4M2Q",
        placedAt: "2024-01-15T10:30:00Z",
        status: "shipped",
        region: "US-WEST",
        service: "standard",
        couponCode: null,  // Missing coupon - this triggers the crash
        trackingNumber: "1Z999AA10123456784",
        merchandise: 4500,
        discount: 0,
        tax: 450,
        shipping: 800,
        total: 5750,
      },
      {
        number: "ORD-8L5N3R",
        placedAt: "2024-01-16T14:22:00Z",
        status: "pending",
        region: "US-EAST",
        service: "express",
        couponCode: "SAVE10",
        trackingNumber: undefined,  // No tracking yet - also triggers crash
        merchandise: 3200,
        discount: 320,
        tax: 288,
        shipping: 1200,
        total: 4368,
      },
    ];

    const csv = toCsv(columns, rows);

    // Expected: RFC-4180 format with CRLF line endings (ROW_SEPARATOR from csv.js:6)
    // Contract from csv.js:11-14: null/undefined renders as empty string, not "null"
    const expectedLines = [
      // Header row
      "number,placedAt,status,region,service,couponCode,trackingNumber,merchandise,discount,tax,shipping,total",
      // First order: couponCode is null -> empty cell (sixth position)
      "ORD-7K4M2Q,2024-01-15T10:30:00Z,shipped,US-WEST,standard,,1Z999AA10123456784,4500,0,450,800,5750",
      // Second order: trackingNumber is undefined -> empty cell (seventh position)
      "ORD-8L5N3R,2024-01-16T14:22:00Z,pending,US-EAST,express,SAVE10,,3200,320,288,1200,4368",
    ];

    expect(csv).toBe(expectedLines.join("\r\n") + "\r\n");
  });

  it("renders empty CSV (header only) when no orders in date range", () => {
    // This case works even with the bug because header row contains only strings
    const columns = ["number", "placedAt", "status", "total"];
    const rows = [];

    const csv = toCsv(columns, rows);

    expect(csv).toBe("number,placedAt,status,total\r\n");
  });
});
