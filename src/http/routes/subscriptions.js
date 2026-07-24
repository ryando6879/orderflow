const subscriptionService = require("../../services/subscriptionService");
const subscriptionRepo = require("../../repositories/subscriptionRepo");
const { getPlan, PLANS } = require("../../plans");
const { ok, created } = require("../respond");
const { requireScope } = require("../middleware/auth");
const { body } = require("../middleware/validate");

// OrderFlow Plus endpoints. The plans page and the account billing page
// both talk to these.

function view(subscription) {
  const plan = getPlan(subscription.planId);
  return {
    id: subscription.id,
    plan: { id: plan.id, name: plan.name, priceCents: plan.priceCents },
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
    dunningAttempts: subscription.dunningAttempts || 0,
  };
}

function register(router) {
  // GET /v1/plans
  router.get("/v1/plans", (ctx) => ok(ctx.res, { data: Object.values(PLANS) }), [
    requireScope("orders:read"),
  ]);

  // POST /v1/subscriptions
  router.post(
    "/v1/subscriptions",
    async (ctx) => {
      const subscription = await subscriptionService.subscribe({
        customerId: ctx.body.customerId,
        planId: ctx.body.planId,
        paymentMethodId: ctx.body.paymentMethodId,
      });
      return created(ctx.res, view(subscription), `/v1/subscriptions/${subscription.id}`);
    },
    [requireScope("checkout:write"), body({ customerId: "string", planId: "string", paymentMethodId: "string" })]
  );

  // GET /v1/subscriptions/:id
  router.get(
    "/v1/subscriptions/:id",
    (ctx) => {
      const subscription = subscriptionRepo.byId(ctx.params.id);
      if (!subscription) {
        const err = new Error(`subscription ${ctx.params.id} not found`);
        err.code = "not_found";
        err.statusCode = 404;
        throw err;
      }
      return ok(ctx.res, view(subscription));
    },
    [requireScope("orders:read")]
  );

  // POST /v1/subscriptions/:id/change
  router.post(
    "/v1/subscriptions/:id/change",
    async (ctx) => {
      const result = await subscriptionService.changePlan({
        subscriptionId: ctx.params.id,
        planId: ctx.body.planId,
        changeIso: ctx.body.changeIso,
        paymentMethodId: ctx.body.paymentMethodId,
      });
      return ok(ctx.res, {
        subscription: view(result.subscription),
        credit: result.credit,
        charge: result.charge,
        net: result.net,
      });
    },
    [requireScope("checkout:write"), body({ planId: "string", changeIso: "string?", paymentMethodId: "string?" })]
  );

  // DELETE /v1/subscriptions/:id — cancels at period end.
  router.delete(
    "/v1/subscriptions/:id",
    (ctx) => ok(ctx.res, view(subscriptionService.cancel(ctx.params.id))),
    [requireScope("checkout:write")]
  );
}

module.exports = { register, view };
