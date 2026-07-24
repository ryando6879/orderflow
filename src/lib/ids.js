const crypto = require("node:crypto");

// Human-facing identifiers. Order numbers are printed on packing slips and
// read back to support over the phone, so they avoid characters that are
// easy to mishear or mistype (no letter O, no digit 0, no I/1).
const SAFE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * A random opaque id with a type prefix, e.g. "cus_9f2a…". Used for
 * internal references (customers, carts, webhook events).
 *
 * @param {string} prefix short type tag
 * @param {number} [bytes] entropy
 */
function opaqueId(prefix, bytes = 12) {
  return `${prefix}_${crypto.randomBytes(bytes).toString("hex")}`;
}

/**
 * A customer-facing order number, e.g. "ORD-7K4M2Q".
 * Always uppercase, always 6 characters after the dash.
 */
function orderNumber() {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += SAFE_ALPHABET[crypto.randomInt(SAFE_ALPHABET.length)];
  }
  return `ORD-${suffix}`;
}

/**
 * Stable short hash of a payload — used for idempotency fingerprints and
 * cache keys. Deterministic across processes (no per-boot salt).
 */
function fingerprint(value) {
  const json = typeof value === "string" ? value : JSON.stringify(value ?? null);
  return crypto.createHash("sha256").update(json).digest("hex").slice(0, 16);
}

module.exports = { opaqueId, orderNumber, fingerprint, SAFE_ALPHABET };
