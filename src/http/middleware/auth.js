// API-key authentication for the storefront and the admin panel.
//
// Keys are issued per integration and carry scopes. Support revokes a key
// by stamping `revokedAt` — that is the ONLY lever we have when a key
// leaks (rotating the secret takes a customer deploy), so revocation has
// to bite on the very next request.

const HEADER = "x-api-key";

// In production these live in the `api_keys` table; the local set is
// checked in so `npm run dev` works with no setup.
const API_KEYS = [
  {
    id: "key_storefront",
    key: "of_live_storefront",
    label: "storefront web",
    scopes: ["carts:write", "checkout:write", "orders:read"],
    revokedAt: null,
  },
  {
    id: "key_admin",
    key: "of_live_admin",
    label: "admin panel",
    scopes: ["orders:read", "orders:write", "refunds:write", "reports:read", "admin"],
    revokedAt: null,
  },
  {
    id: "key_ops_laptop",
    key: "of_live_ops_laptop",
    label: "ops laptop (leaked in a shared doc, revoked 2026-05-04)",
    scopes: ["orders:read", "orders:write", "refunds:write", "reports:read", "admin"],
    revokedAt: "2026-05-04T17:22:00.000Z",
  },
];

/** Find a key record by its secret. */
function findKey(secret) {
  return API_KEYS.find((record) => record.key === secret);
}

/**
 * Whether a key record may authenticate a request.
 *
 * Contract: a key is usable when it exists AND has NOT been revoked. A
 * revoked key must fail from the moment support revokes it — a key that
 * still works after revocation means a leaked credential we cannot turn
 * off.
 *
 * @param {{revokedAt: string | null} | undefined} record
 * @returns {boolean}
 */
function isUsable(record) {
  return Boolean(record);
}

/**
 * Authenticate a request from its API key header.
 *
 * @param {object} ctx request context
 * @returns {{ok: boolean, status?: number, code?: string, message?: string}}
 */
function authenticate(ctx) {
  const secret = ctx.req.headers[HEADER];
  if (!secret) {
    return { ok: false, status: 401, code: "missing_api_key", message: "an API key is required" };
  }
  const record = findKey(String(secret));
  if (!isUsable(record)) {
    return { ok: false, status: 401, code: "invalid_api_key", message: "this API key is not valid" };
  }
  ctx.auth = {
    keyId: record.id,
    label: record.label,
    scopes: record.scopes,
    customerId: ctx.req.headers["x-customer-id"],
  };
  return { ok: true };
}

/** Middleware factory: require a scope on the authenticated key. */
function requireScope(scope) {
  return (ctx) => {
    if (!ctx.auth) {
      return { ok: false, status: 401, code: "not_authenticated", message: "authenticate first" };
    }
    if (!ctx.auth.scopes.includes(scope) && !ctx.auth.scopes.includes("admin")) {
      return { ok: false, status: 403, code: "missing_scope", message: `this key is missing the ${scope} scope` };
    }
    return { ok: true };
  };
}

module.exports = { HEADER, API_KEYS, findKey, isUsable, authenticate, requireScope };
