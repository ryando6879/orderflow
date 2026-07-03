// Product catalog. Prices are in cents. Items on sale carry a `discount`
// object; regular-price items have no `discount` key.
const PRODUCTS = {
  "TEE-1": { name: "Logo Tee", price: 1900 },
  "MUG-1": { name: "Coffee Mug", price: 1200, discount: { percent: 10 } },
  "HAT-1": { name: "Trucker Hat", price: 2400, discount: { percent: 15 } },
  "STK-1": { name: "Sticker Pack", price: 600 },
};

function getProduct(sku) {
  const product = PRODUCTS[sku];
  if (!product) {
    throw new Error(`Unknown SKU: ${sku}`);
  }
  return product;
}

module.exports = { getProduct };
