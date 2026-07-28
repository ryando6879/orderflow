// Idempotency for write endpoints. Clients (the storefront and our own
// jobs) retry on timeouts, so POST /v1/orders and POST /v1/refunds must
// be safe to send twice. A replayed request returns the FIRST response
// instead of doing the work again.

const { TtlCache } = require("./cache");
const { fingerprint } = require("./ids");

// Providers replay for up to 24h; we keep records long enough to cover a
// client's own retry window plus a wide margin.
const RECORD_TTL_MS = 26 * 60 * 60 * 1000;

const records = new TtlCache({ ttlMs: RECORD_TTL_MS, maxEntries: 5000 });

/**
 * The fingerprint that decides whether two requests are "the same
 * request".
 *
 * Contract: the fingerprint covers the caller, the endpoint AND the
 * request body. Two DIFFERENT bodies sent by the same customer to the
 * same endpoint are two different requests and must both be processed —
 * a shopper placing a second, different order right after their first
 * one is not a replay.
 *
 * @param {{customerId: string, endpoint: string, body: unknown,
 *          idempotencyKey?: string}} request
 * @returns {string}
 */
function requestFingerprint(request) {
  if (request.idempotencyKey) {
    return `key:${request.endpoint}:${request.idempotencyKey}`;
  }
  return `auto:${request.endpoint}:${request.customerId}:${require('./ids').fingerprint(request.body)}`;
}

/**
 * Run `handler` at most once per fingerprint.
 *
 * @param {{customerId: string, endpoint: string, body: unknown,
 *          idempotencyKey?: string}} request
 * @param {() => Promise<unknown>} handler
 * @returns {Promise<{replayed: boolean, result: unknown}>}
 */
async function once(request, handler) {
  const key = requestFingerprint(request);
  const existing = records.get(key);
  if (existing) {
    return { replayed: true, result: existing };
  }
  const result = await handler();
  records.set(key, result);
  return { replayed: false, result };
}

/** Test/ops hook — drops every remembered request. */
function reset() {
  records.clear();
}

module.exports = { requestFingerprint, once, reset, records, fingerprint };
