// Access logging. One line per request, emitted when the response
// finishes so it can carry the status and the duration.

/** Log the request on completion. Never blocks the response. */
function requestLogger(ctx) {
  const startedAt = Date.now();
  ctx.res.on("finish", () => {
    ctx.log.info("request", {
      method: ctx.req.method,
      path: ctx.path,
      status: ctx.res.statusCode,
      durationMs: Date.now() - startedAt,
      customerId: ctx.auth?.customerId,
    });
  });
  return { ok: true };
}

module.exports = { requestLogger };
