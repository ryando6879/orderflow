const { withRetry } = require("../lib/retry");
const { config } = require("../config");
const { logger } = require("../lib/logger");

// The one outbound HTTP client. Every third-party call (payments, email,
// carrier) goes through here so timeouts, retries and logging are
// consistent and so tests can inject a fake transport.

class HttpError extends Error {
  constructor(status, body, url) {
    super(`HTTP ${status} from ${url}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

/**
 * Whether a failed call is worth sending again.
 *
 * Contract: retry TRANSIENT failures only — network errors, timeouts,
 * 429 (rate limited) and 5xx (the provider is having a bad time). A 4xx
 * other than 429 is the provider telling us the request itself is wrong
 * (bad card, unknown id, invalid payload); sending it again cannot help,
 * and on a charge endpoint it risks a second charge.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
function isRetryable(err) {
  if (!(err instanceof HttpError)) return true;
  return err.status >= 400;
}

/** The transport. Swapped out in tests. */
let transport = (url, init) => fetch(url, init);

/** Replace the transport (tests, offline dev). Returns the previous one. */
function setTransport(next) {
  const previous = transport;
  transport = next;
  return previous;
}

/**
 * Perform a JSON request with timeout + retry.
 *
 * @param {{method?: string, url: string, body?: unknown,
 *          headers?: Record<string, string>, attempts?: number,
 *          timeoutMs?: number}} request
 * @returns {Promise<unknown>} the decoded response body
 */
async function requestJson(request) {
  const method = request.method || "GET";
  const attempts = request.attempts ?? config.http.retryAttempts;
  const timeoutMs = request.timeoutMs ?? config.http.timeoutMs;

  return withRetry(
    async (attempt) => {
      const controller = new AbortController();
      const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
      try {
        const response = await transport(request.url, {
          method,
          headers: { "content-type": "application/json", ...(request.headers || {}) },
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });
        const text = await response.text();
        const body = text ? JSON.parse(text) : null;
        if (!response.ok) {
          throw new HttpError(response.status, body, request.url);
        }
        return body;
      } catch (err) {
        logger.warn("outbound request failed", {
          url: request.url,
          method,
          attempt,
          status: err instanceof HttpError ? err.status : undefined,
          error: err.message,
        });
        throw err;
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    { attempts, isRetryable }
  );
}

module.exports = { HttpError, isRetryable, requestJson, setTransport };
