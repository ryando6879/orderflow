const health = require("./health");
const orders = require("./orders");
const carts = require("./carts");
const checkout = require("./checkout");
const subscriptions = require("./subscriptions");
const admin = require("./admin");
const webhooks = require("./webhooks");

// Route registration order matters only for overlapping patterns, and we
// keep patterns non-overlapping, so this list is just alphabetical-ish by
// how often we touch it.
const MODULES = [health, carts, checkout, orders, subscriptions, admin, webhooks];

/** Register every route module on a router. */
function registerRoutes(router) {
  for (const module of MODULES) {
    module.register(router);
  }
  return router;
}

module.exports = { registerRoutes, MODULES };
