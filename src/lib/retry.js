// Generic retry with exponential backoff and full jitter. Used by the
// outbound http client and the background jobs. The caller decides what
// is retryable — this module only owns the timing.

/** Sleep, injectable so tests do not actually wait. */
function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delay before attempt N, in milliseconds.
 *
 * Contract: exponential — attempt 1 waits `baseMs`, attempt 2 waits
 * `2 * baseMs`, attempt 3 waits `4 * baseMs`, capped at `maxMs`.
 *
 * @param {number} attempt 1-based attempt number that just failed
 * @param {{baseMs?: number, maxMs?: number}} [options]
 */
function backoffMs(attempt, { baseMs = 200, maxMs = 30_000 } = {}) {
  return Math.min(maxMs, baseMs * 2 ** (attempt - 1));
}

/**
 * Run `task` until it succeeds or the attempt budget runs out.
 *
 * @param {() => Promise<unknown>} task
 * @param {{attempts?: number, baseMs?: number, maxMs?: number,
 *          isRetryable?: (err: unknown) => boolean,
 *          sleep?: (ms: number) => Promise<void>,
 *          onRetry?: (info: {attempt: number, delayMs: number, error: unknown}) => void}} [options]
 */
async function withRetry(task, options = {}) {
  const attempts = options.attempts ?? 3;
  const isRetryable = options.isRetryable || (() => true);
  const sleep = options.sleep || defaultSleep;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !isRetryable(err)) break;
      const delayMs = backoffMs(attempt, options);
      if (options.onRetry) options.onRetry({ attempt, delayMs, error: err });
      await sleep(delayMs);
    }
  }
  throw lastError;
}

module.exports = { withRetry, backoffMs, defaultSleep };
