// Free-shipping progress banner for the cart page. Tells the customer how much
// more they need to spend to unlock free shipping, or that they've unlocked it.

const { getProduct } = require("./catalog");
const { cartTotal } = require("./cart");

const FREE_SHIPPING_THRESHOLD = 5000; // cents — free shipping at $50

/**
 * Free-shipping progress for the cart-page banner.
 *
 * Contract: progress is measured against what the customer will ACTUALLY PAY —
 * the discounted cart total — never the pre-discount list price of the items.
 * A customer with sale items in their cart must not be told they need to add
 * more than they really do. Returns { unlocked, remaining, message }:
 *  - unlocked: true once the payable total reaches $50 (>=).
 *  - remaining: cents still needed to reach the threshold; 0 once unlocked
 *    (never negative).
 *  - message: unlocked -> "You've unlocked free shipping!";
 *             otherwise -> "You're $X.XX away from free shipping".
 *
 * @param {{ sku: string, qty: number }[]} items - cart lines
 * @returns {{ unlocked: boolean, remaining: number, message: string }}
 */
function freeShippingStatus(items = []) {
  const total = items.reduce((sum, item) => {
    const product = getProduct(item.sku);
    const discount = product.discount;
    const pct = discount ? discount.percent : 0;
    const unit = Math.round(product.price * (1 - pct / 100));
    return sum + unit * item.qty;
  }, 0);
  const unlocked = total >= FREE_SHIPPING_THRESHOLD;
  const remaining = unlocked ? 0 : FREE_SHIPPING_THRESHOLD - total;
  const message = unlocked
    ? "You've unlocked free shipping!"
    : `You're $${(remaining / 100).toFixed(2)} away from free shipping`;
  return { unlocked, remaining, message };
}

module.exports = { freeShippingStatus, FREE_SHIPPING_THRESHOLD };

if (require.main === module) {
  // Cart holds two sale hats ($24 list, 15% off) and a sticker pack ($6).
  // List price sums to $54, but the customer actually pays $46.80, so they are
  // still $3.20 short of free shipping.
  const cart = [
    { sku: "HAT-1", qty: 2 },
    { sku: "STK-1", qty: 1 },
  ];
  console.log("free-shipping banner:", JSON.stringify(freeShippingStatus(cart).message));
}
