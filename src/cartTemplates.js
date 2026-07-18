// Shape templates for cart-related records. Templates describe what a fresh
// record looks like so every module builds the same structure.

/**
 * Template for a brand-new, empty cart.
 *
 * This object is a TEMPLATE ONLY: it documents the shape of a new cart
 * (`items` list plus an optional coupon). Consumers MUST build a fresh copy
 * per cart they create — storing or mutating the template itself would alias
 * every consumer to one shared object.
 *
 * @type {{ items: { sku: string, qty: number }[], couponCode: string | null }}
 */
const EMPTY_CART = { items: [], couponCode: null };

module.exports = { EMPTY_CART };
