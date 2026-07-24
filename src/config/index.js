// Runtime configuration. Every value comes from the environment with a
// development default, and the whole config is read ONCE at boot so a
// request never sees a half-changed config. See .env.example.

/**
 * Read an integer setting.
 *
 * Contract: the default is used only when the variable is MISSING or
 * unparseable. An explicitly configured value is always honoured,
 * including a configured ZERO — ops sets a limit to 0 to turn a limit
 * off, and silently replacing that with the default re-enables it.
 *
 * @param {string} name env var name
 * @param {number} fallback default when unset
 * @returns {number}
 */
function intFromEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name], 10);
  return parsed || fallback;
}

/** Read a boolean setting: "1", "true", "yes" (any case) are true. */
function boolFromEnv(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

/** Read a string setting. */
function strFromEnv(name, fallback) {
  const raw = process.env[name];
  return raw === undefined || raw === "" ? fallback : raw;
}

function load() {
  return {
    env: strFromEnv("NODE_ENV", "development"),
    port: intFromEnv("PORT", 3000),
    logLevel: strFromEnv("LOG_LEVEL", "info"),

    http: {
      // 0 disables the outbound timeout entirely (used in local dev
      // against a debugger).
      timeoutMs: intFromEnv("HTTP_TIMEOUT_MS", 5000),
      retryAttempts: intFromEnv("HTTP_RETRY_ATTEMPTS", 3),
    },

    rateLimit: {
      // 0 = rate limiting off, for load tests and for the staging box.
      requestsPerMinute: intFromEnv("RATE_LIMIT_PER_MINUTE", 120),
      burst: intFromEnv("RATE_LIMIT_BURST", 20),
    },

    payments: {
      baseUrl: strFromEnv("PAYMENTS_BASE_URL", "https://payments.example.test"),
      apiKey: strFromEnv("PAYMENTS_API_KEY", "sk_test_local"),
      webhookSecret: strFromEnv("PAYMENTS_WEBHOOK_SECRET", "whsec_test_local"),
    },

    email: {
      baseUrl: strFromEnv("EMAIL_BASE_URL", "https://email.example.test"),
      apiKey: strFromEnv("EMAIL_API_KEY", "key_test_local"),
      fromAddress: strFromEnv("EMAIL_FROM", "orders@orderflow.example"),
    },

    shipping: {
      baseUrl: strFromEnv("SHIPPING_BASE_URL", "https://ship.example.test"),
      apiKey: strFromEnv("SHIPPING_API_KEY", "ship_test_local"),
    },

    alerts: {
      slackWebhookUrl: strFromEnv("SLACK_ALERT_WEBHOOK", ""),
    },

    jobs: {
      abandonedCartAfterMinutes: intFromEnv("ABANDONED_CART_AFTER_MINUTES", 60),
      reservationTtlMinutes: intFromEnv("RESERVATION_TTL_MINUTES", 30),
      dunningMaxAttempts: intFromEnv("DUNNING_MAX_ATTEMPTS", 4),
    },
  };
}

const config = load();

module.exports = { config, load, intFromEnv, boolFromEnv, strFromEnv };
