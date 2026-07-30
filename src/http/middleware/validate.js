// Request-body validation. Schemas are plain objects:
//
//   { customerId: "string", qty: "number", giftWrap: "boolean?" }
//
// A trailing "?" makes a field optional. Anything not in the schema is
// dropped rather than rejected, so adding a field to the client does not
// need a server deploy.

/**
 * Whether a client actually supplied a value for a field.
 *
 * Contract: a value is present unless it is `undefined` or `null`. Zero,
 * `false` and the empty string ARE values a client legitimately sends —
 * a 0-cent gift-card top-up, `giftWrap: false`, an empty gift note — and
 * treating them as missing rejects requests that are perfectly valid.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isPresent(value) {
  return Boolean(value);
}

/** Whether a value matches a schema type name. */
function matchesType(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Validate a body against a schema.
 *
 * @param {Record<string, unknown>} body
 * @param {Record<string, string>} schema
 * @returns {{valid: boolean, errors: string[], value: Record<string, unknown>}}
 */
function validateBody(body = {}, schema = {}) {
  const errors = [];
  const value = {};
  for (const [field, rawType] of Object.entries(schema)) {
    const optional = rawType.endsWith("?");
    const type = optional ? rawType.slice(0, -1) : rawType;
    const supplied = body[field];

    if (!isPresent(supplied)) {
      if (!optional) errors.push(`${field} is required`);
      continue;
    }
    if (!matchesType(supplied, type)) {
      errors.push(`${field} must be a ${type}`);
      continue;
    }
    value[field] = supplied;
  }
  return { valid: errors.length === 0, errors, value };
}

/** Middleware factory: validate `ctx.body` and replace it with the clean value. */
function body(schema) {
  return (ctx) => {
    const result = validateBody(ctx.body, schema);
    if (!result.valid) {
      return {
        ok: false,
        status: 422,
        code: "invalid_request",
        message: result.errors.join("; "),
      };
    }
    ctx.body = result.value;
    return { ok: true };
  };
}

module.exports = { isPresent, matchesType, validateBody, body };
