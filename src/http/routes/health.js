const store = require("../../db/store");
const { ok } = require("../respond");
const { snapshot } = require("../../config/featureFlags");
const { config } = require("../../config");

// Liveness and readiness. The load balancer polls /health; the deploy
// pipeline polls /health/ready and refuses to shift traffic until the
// store has been seeded.

const BOOTED_AT = new Date().toISOString();

function register(router) {
  router.get("/health", (ctx) =>
    ok(ctx.res, { status: "ok", env: config.env, bootedAt: BOOTED_AT })
  );

  router.get("/health/ready", (ctx) => {
    const ready = store.count("customers") > 0;
    return ok(ctx.res, {
      status: ready ? "ready" : "starting",
      tables: Object.fromEntries(store.TABLE_NAMES.map((name) => [name, store.count(name)])),
    });
  });

  router.get("/v1/routes", (ctx) => ok(ctx.res, { routes: ctx.router.list() }));

  router.get("/v1/flags", (ctx) => ok(ctx.res, { flags: snapshot() }));
}

module.exports = { register, BOOTED_AT };
