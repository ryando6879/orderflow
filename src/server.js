const http = require("node:http");
const { createApp } = require("./http/app");
const { registerRoutes } = require("./http/routes");
const { seed } = require("./db/seed");
const { startScheduler } = require("./jobs/scheduler");
const { config } = require("./config");
const { logger } = require("./lib/logger");

// Process entry point. Boots the store, the HTTP listener and the job
// scheduler, and shuts all three down cleanly on SIGTERM so a deploy does
// not cut a request in half.

function buildServer() {
  const app = createApp({ registerRoutes });
  return http.createServer((req, res) => {
    app.handle(req, res).catch((err) => {
      logger.error("request handler rejected", { error: err.message, stack: err.stack });
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: { code: "internal_error", message: "something went wrong" } }));
      }
    });
  });
}

function start() {
  if (config.env !== "production") {
    const counts = seed();
    logger.info("seeded development data", counts);
  }

  const server = buildServer();
  const scheduler = startScheduler();

  server.listen(config.port, () => {
    logger.info("orderflow listening", { port: config.port, env: config.env });
  });

  const shutdown = (signal) => {
    logger.info("shutting down", { signal });
    scheduler.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

module.exports = { buildServer, start };

if (require.main === module) {
  start();
}
