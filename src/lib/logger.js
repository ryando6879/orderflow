// Structured logger. Every line is a single JSON object so the log
// shipper can index fields without a grok pattern. The request id is
// attached by the http middleware (see src/http/middleware/requestId.js)
// and carried through the call by passing the child logger down.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function levelFromEnv() {
  const name = (process.env.LOG_LEVEL || "info").toLowerCase();
  return LEVELS[name] === undefined ? LEVELS.info : LEVELS[name];
}

function write(level, fields, message) {
  if (LEVELS[level] < levelFromEnv()) return;
  const line = { level, msg: message, ts: new Date().toISOString(), ...fields };
  const sink = level === "error" || level === "warn" ? process.stderr : process.stdout;
  sink.write(`${JSON.stringify(line)}\n`);
}

/**
 * Build a logger. Fields passed here are merged into every line the
 * logger emits; `child()` returns a new logger with extra sticky fields.
 *
 * @param {Record<string, unknown>} [fields]
 */
function createLogger(fields = {}) {
  const logger = {
    child(extra) {
      return createLogger({ ...fields, ...extra });
    },
  };
  for (const level of Object.keys(LEVELS)) {
    logger[level] = (message, extra) => write(level, { ...fields, ...extra }, message);
  }
  return logger;
}

const logger = createLogger({ service: "orderflow" });

module.exports = { createLogger, logger, LEVELS };
