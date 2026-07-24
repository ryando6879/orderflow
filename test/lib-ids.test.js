import { describe, it, expect } from "vitest";
import { opaqueId, orderNumber, fingerprint, SAFE_ALPHABET } from "../src/lib/ids.js";

describe("identifiers", () => {
  it("prefixes opaque ids and keeps them unique", () => {
    const a = opaqueId("cus");
    const b = opaqueId("cus");
    expect(a.startsWith("cus_")).toBe(true);
    expect(a).not.toBe(b);
  });

  it("builds order numbers from the unambiguous alphabet", () => {
    const number = orderNumber();
    expect(number).toMatch(/^ORD-[A-Z2-9]{6}$/);
    for (const character of number.slice(4)) {
      expect(SAFE_ALPHABET).toContain(character);
    }
  });

  it("fingerprints deterministically", () => {
    expect(fingerprint({ a: 1 })).toBe(fingerprint({ a: 1 }));
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
  });
});
