const { opaqueId } = require("../../lib/ids");

// Request correlation. Every request gets an id: either the one the
// caller sent (so the storefront can tie a browser error to a server log)
// or a fresh one. The id goes back out on the response and into every log
// line for the request.

const HEADER = "x-request-id";

/** Attach a request id to the context and echo it on the response. */
function requestId(ctx) {
  const incoming = ctx.req.headers[HEADER];
  ctx.requestId = typeof incoming === "string" && incoming.length <= 64 ? incoming : opaqueId("req", 8);
  ctx.res.setHeader(HEADER, ctx.requestId);
  ctx.log = ctx.log.child({ requestId: ctx.requestId });
  return { ok: true };
}

module.exports = { requestId, HEADER };
