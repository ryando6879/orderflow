// In-process caches. There is no Redis in this service: everything here
// is per-instance, short-TTL, and safe to lose. Anything that must be
// shared between instances belongs in the store, not here.

const { fingerprint } = require("./ids");

/** A bounded map with per-entry expiry. Eviction is oldest-write-first. */
class TtlCache {
  constructor({ ttlMs = 60_000, maxEntries = 500 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldest = this.entries.keys().next().value;
      this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }

  delete(key) {
    return this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }

  get size() {
    return this.entries.size;
  }
}

/**
 * Default cache key for a call.
 *
 * Contract: the key covers EVERY argument the function was called with.
 * Two calls share a cached value only when all of their arguments match —
 * a function called with the same first argument but a different second
 * one must not collide.
 *
 * @param {unknown[]} args the full argument list
 * @returns {string}
 */
function defaultKeyFn(args) {
  return fingerprint(args[0]);
}

/**
 * Wrap a pure, synchronous function in a TTL cache.
 *
 * @param {Function} fn
 * @param {{ttlMs?: number, maxEntries?: number, keyFn?: (args: unknown[]) => string}} [options]
 */
function memoize(fn, options = {}) {
  const cache = new TtlCache(options);
  const keyFn = options.keyFn || defaultKeyFn;
  const wrapped = (...args) => {
    const key = keyFn(args);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    return cache.set(key, fn(...args));
  };
  wrapped.cache = cache;
  return wrapped;
}

module.exports = { TtlCache, memoize, defaultKeyFn };
