const { config } = require("../../config");

// Per-caller rate limiting. This is a FIXED-WINDOW counter, deliberately:
// it is simple to reason about, and a shopper who trips it knows exactly
// when it clears ("try again in under a minute").
//
// A window opens with the first request inside it and closes WINDOW_MS
// later. The count then resets, whether or not the caller kept knocking
// in between — a customer refreshing the page while they wait must still
// get back in when the window rolls over.

const WINDOW_MS = 60_000;

const buckets = new Map();

/** The bucket key: the API key when we have one, else the client IP. */
function bucketKey(ctx) {
  return ctx.auth?.keyId || ctx.req.socket?.remoteAddress || "anonymous";
}

/**
 * Whether a bucket's window has rolled over.
 *
 * Contract: the window is measured from when it OPENED — the timestamp of
 * the first request in the window — so it always expires WINDOW_MS after
 * that, no matter how much traffic arrived in between. Measuring from the
 * most recent request instead turns a fixed window into one that a busy
 * caller can never leave.
 *
 * @param {{windowStart: number, lastRequestAt: number}} bucket
 * @param {number} now epoch millis
 * @returns {boolean}
 */
function isWindowExpired(bucket, now) {
  return now - bucket.lastRequestAt >= WINDOW_MS;
}

/**
 * Count a request against its bucket.
 *
 * @param {object} ctx
 * @param {number} [nowMs] injectable clock
 * @returns {{ok: boolean, status?: number, code?: string, message?: string,
 *            remaining?: number}}
 */
function rateLimit(ctx, nowMs) {
  const limit = config.rateLimit.requestsPerMinute;
  if (limit <= 0) return { ok: true };

  const now = nowMs ?? Date.now();
  const key = bucketKey(ctx);
  let bucket = buckets.get(key);

  if (!bucket || isWindowExpired(bucket, now)) {
    bucket = { windowStart: now, lastRequestAt: now, count: 0 };
  }

  bucket.count += 1;
  bucket.lastRequestAt = now;
  buckets.set(key, bucket);

  const remaining = Math.max(0, limit - bucket.count);
  ctx.res.setHeader("x-ratelimit-limit", String(limit));
  ctx.res.setHeader("x-ratelimit-remaining", String(remaining));

  if (bucket.count > limit) {
    const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    ctx.res.setHeader("retry-after", String(Math.max(1, retryAfter)));
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "too many requests — try again shortly",
    };
  }
  return { ok: true, remaining };
}

/** Test/ops hook. */
function reset() {
  buckets.clear();
}

module.exports = { WINDOW_MS, rateLimit, isWindowExpired, bucketKey, reset, buckets };
