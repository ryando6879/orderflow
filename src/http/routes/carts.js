const cartRepo = require("../../repositories/cartRepo");
const customerRepo = require("../../repositories/customerRepo");
const { priceCart } = require("../../services/pricingService");
const inventoryService = require("../../services/inventoryService");
const { freeShippingStatus } = require("../../freeShipping");
const { ok, created } = require("../respond");
const { requireScope } = require("../middleware/auth");
const { body } = require("../middleware/validate");
const { opaqueId } = require("../../lib/ids");

// Cart endpoints. Carts are per browser session; a signed-in shopper's
// cart also carries their customer id so pricing can apply their member
// discount.

/** The cart payload the storefront renders. */
function cartView(cart) {
  const customer = cart.customerId ? customerRepo.byId(cart.customerId) : {};
  const priced = priceCart({ items: cart.items, region: cart.region }, customer || {});
  return {
    id: cart.id,
    items: cart.items.map((item, index) => ({
      sku: item.sku,
      qty: item.qty,
      subtotal: priced.lines[index].subtotal,
      available: inventoryService.availableForSku(item.sku),
    })),
    pricing: {
      merchandise: priced.merchandise,
      discount: priced.discount,
      promo: priced.promo,
      shipping: priced.shipping,
      tax: priced.tax,
      taxLabel: priced.taxLabel,
      total: priced.total,
    },
    freeShipping: freeShippingStatus(cart.items),
  };
}

function requireCart(id) {
  const cart = cartRepo.byId(id);
  if (!cart) {
    const err = new Error(`cart ${id} not found`);
    err.code = "not_found";
    err.statusCode = 404;
    throw err;
  }
  return cart;
}

function register(router) {
  // POST /v1/carts
  router.post(
    "/v1/carts",
    (ctx) => {
      const cart = cartRepo.create({
        id: opaqueId("cart"),
        sessionId: ctx.body.sessionId,
        customerId: ctx.body.customerId,
        region: ctx.body.region || "us",
        items: ctx.body.items || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return created(ctx.res, cartView(cart), `/v1/carts/${cart.id}`);
    },
    [requireScope("carts:write"), body({ sessionId: "string", customerId: "string?", region: "string?", items: "array?" })]
  );

  // GET /v1/carts/:id
  router.get(
    "/v1/carts/:id",
    (ctx) => ok(ctx.res, cartView(requireCart(ctx.params.id))),
    [requireScope("carts:write")]
  );

  // POST /v1/carts/:id/items — add or replace a line.
  router.post(
    "/v1/carts/:id/items",
    (ctx) => {
      const cart = requireCart(ctx.params.id);
      const items = [...cart.items];
      const existing = items.findIndex((item) => item.sku === ctx.body.sku);
      if (existing >= 0) {
        items[existing] = { sku: ctx.body.sku, qty: items[existing].qty + ctx.body.qty };
      } else {
        items.push({ sku: ctx.body.sku, qty: ctx.body.qty });
      }
      return ok(ctx.res, cartView(cartRepo.setItems(cart.id, items)));
    },
    [requireScope("carts:write"), body({ sku: "string", qty: "number" })]
  );

  // POST /v1/carts/:id/gift — gift wrapping and an optional note.
  router.post(
    "/v1/carts/:id/gift",
    (ctx) => {
      const cart = requireCart(ctx.params.id);
      const updated = cartRepo.update(cart.id, {
        giftWrap: ctx.body.giftWrap,
        giftNote: ctx.body.giftNote,
      });
      return ok(ctx.res, { ...cartView(updated), giftWrap: updated.giftWrap, giftNote: updated.giftNote });
    },
    [requireScope("carts:write"), body({ giftWrap: "boolean", giftNote: "string?" })]
  );

  // DELETE /v1/carts/:id
  router.delete(
    "/v1/carts/:id",
    (ctx) => {
      cartRepo.remove(ctx.params.id);
      return ok(ctx.res, { deleted: true });
    },
    [requireScope("carts:write")]
  );
}

module.exports = { register, cartView };
