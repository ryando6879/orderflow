const { lineTotal } = require("../cart");
const { shippingCost } = require("../shipping");
const { memberTier } = require("../loyalty");
const { bestPromotion, promotionDiscount } = require("../promotions");
const { taxFor, taxLabel } = require("../domain/taxRules");
const { sumCents, applyPercent } = require("../domain/money");
const { memoize } = require("../lib/cache");

/**
 * Price a cart end to end: merchandise, discounts, shipping, tax.
 *
 * This is the one place the storefront, the checkout review page and the
 * charge all get their numbers from, so the same cart always prices the
 * same way. The order of operations is:
 *
 *   1. line subtotals from the catalog (sale prices applied per line)
 *   2. member discount on the merchandise subtotal
 *   3. best order promotion, evaluated on the pre-member-discount subtotal
 *   4. shipping for the region and item count
 *   5. tax, on what the customer actually pays for merchandise
 *
 * @param {{items: Array<{sku: string, qty: number}>, region: string}} cart
 * @param {{lifetimeSpend?: number}} [member]
 * @returns {{lines: Array<{sku: string, qty: number, subtotal: number}>,
 *            merchandise: number, memberDiscount: number, promo: string|null,
 *            promoDiscount: number, discount: number, shipping: number,
 *            tax: number, taxLabel: string, total: number}} cents
 */
function priceCart(cart, member = {}) {
  const lines = cart.items.map((item) => ({
    sku: item.sku,
    qty: item.qty,
    subtotal: lineTotal(item),
  }));
  const merchandise = sumCents(lines.map((line) => line.subtotal));

  const tier = memberTier(member);
  const memberDiscount = applyPercent(merchandise, tier.discountPct);
  const promo = bestPromotion(merchandise);
  const promoDiscount = promotionDiscount(merchandise, promo);
  const discount = memberDiscount + promoDiscount;

  const itemCount = cart.items.reduce((count, item) => count + item.qty, 0);
  const shipping = shippingCost(cart.region, itemCount);

  const tax = taxFor({ merchandise, discount, shipping, region: cart.region });

  return {
    lines,
    merchandise,
    memberDiscount,
    promo: promo ? promo.code : null,
    promoDiscount,
    discount,
    shipping,
    tax,
    taxLabel: taxLabel(cart.region),
    total: merchandise - discount + shipping + tax,
  };
}

/**
 * The cart-page price, cached briefly. The storefront re-renders the cart
 * badge and the cart drawer on every navigation, and pricing the same
 * unchanged cart dozens of times a minute is wasted work.
 *
 * Two different carts, two different regions or two different members
 * must never share a cached price.
 */
const cachedPriceCart = memoize(priceCart, { ttlMs: 15_000, maxEntries: 200 });

module.exports = { priceCart, cachedPriceCart };

if (require.main === module) {
  const cart = { items: [{ sku: "TEE-1", qty: 2 }, { sku: "MUG-1", qty: 1 }], region: "us-ca" };
  console.log("priced cart:", priceCart(cart, { lifetimeSpend: 150000 }));
}
