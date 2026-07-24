const { fail } = require("../respond");

// The last line of defence. Domain and repository code throws errors
// carrying `code` and `statusCode`; anything else is a bug and becomes a
// 500 with the request id so support can find it in the logs.

const SAFE_CODES = new Set([
  "not_found",
  "invalid_transition",
  "out_of_stock",
  "declined",
  "refund_exceeds_balance",
  "already_subscribed",
  "invalid_request",
  "rate_limited",
  "missing_scope",
  "invalid_api_key",
  "missing_api_key",
]);

/**
 * Turn a thrown error into a response.
 *
 * @param {unknown} err
 * @param {object} ctx
 */
function handleError(err, ctx) {
  const status = err?.statusCode || 500;
  const code = SAFE_CODES.has(err?.code) ? err.code : "internal_error";
  const message = status === 500 ? "something went wrong on our end" : err.message;

  if (status >= 500) {
    ctx.log.error("unhandled request error", {
      path: ctx.path,
      method: ctx.req.method,
      error: err?.message,
      stack: err?.stack,
    });
  } else {
    ctx.log.warn("request rejected", { path: ctx.path, code, status });
  }

  return fail(ctx.res, status, code, message, ctx.requestId);
}

module.exports = { handleError, SAFE_CODES };
