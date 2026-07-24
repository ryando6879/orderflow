const { Router, parseQuery } = require("./router");
const { fail, ok } = require("./respond");
const { handleError } = require("./middleware/errorHandler");
const { requestId } = require("./middleware/requestId");
const { requestLogger } = require("./middleware/requestLogger");
const { rateLimit } = require("./middleware/rateLimit");
const { authenticate } = require("./middleware/auth");
const { logger } = require("../lib/logger");

const MAX_BODY_BYTES = 512 * 1024;

// Middleware that runs for every request, in order. Each one returns
// `{ok: true}` to continue or a `{ok: false, status, code, message}` to
// stop the request there.
const GLOBAL_MIDDLEWARE = [requestId, requestLogger, rateLimit];

// Paths that skip authentication: the health probe and the provider
// webhooks (which authenticate with a signature instead of a key).
const PUBLIC_PREFIXES = ["/health", "/webhooks/"];

function isPublic(path) {
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

/** Read and JSON-parse a request body. Empty bodies become `{}`. */
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error("request body too large");
      err.code = "invalid_request";
      err.statusCode = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return { raw: "", body: {} };
  try {
    return { raw, body: JSON.parse(raw) };
  } catch {
    const err = new Error("request body is not valid JSON");
    err.code = "invalid_request";
    err.statusCode = 400;
    throw err;
  }
}

/** Build the app: a router with every route registered, plus a handler. */
function createApp({ registerRoutes }) {
  const router = new Router();
  registerRoutes(router);

  async function handle(req, res) {
    const url = new URL(req.url, "http://localhost");
    const ctx = {
      req,
      res,
      path: url.pathname,
      query: parseQuery(url.search),
      params: {},
      body: {},
      raw: "",
      log: logger,
      router,
    };

    try {
      for (const middleware of GLOBAL_MIDDLEWARE) {
        const result = await middleware(ctx);
        if (!result.ok) return fail(res, result.status, result.code, result.message, ctx.requestId);
      }

      if (req.method !== "GET" && req.method !== "DELETE") {
        const parsed = await readBody(req);
        ctx.body = parsed.body;
        ctx.raw = parsed.raw;
      }

      if (!isPublic(ctx.path)) {
        const auth = await authenticate(ctx);
        if (!auth.ok) return fail(res, auth.status, auth.code, auth.message, ctx.requestId);
      }

      const match = router.resolve(req.method, ctx.path);
      if (!match) {
        return fail(res, 404, "not_found", `no route for ${req.method} ${ctx.path}`, ctx.requestId);
      }
      ctx.params = match.params;

      for (const middleware of match.route.middleware) {
        const result = await middleware(ctx);
        if (!result.ok) return fail(res, result.status, result.code, result.message, ctx.requestId);
      }

      return await match.route.handler(ctx);
    } catch (err) {
      return handleError(err, ctx);
    }
  }

  return { handle, router, ok };
}

module.exports = { createApp, readBody, isPublic, GLOBAL_MIDDLEWARE, MAX_BODY_BYTES };
