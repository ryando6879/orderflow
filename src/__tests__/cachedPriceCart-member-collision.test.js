const { describe, it, expect } = require('@jest/globals');
const { cachedPriceCart } = require('../services/pricingService');

describe('cachedPriceCart', () => {
  it('returns different totals for same cart with different member tiers', () => {
    // Cart from the incident report: two tees and a mug in California
    const cart = {
      items: [
        { sku: 'TEE-1', qty: 2 },
        { sku: 'MUG-1', qty: 1 }
      ],
      region: 'us-ca'
    };

    // Long-standing member (gold tier: lifetimeSpend >= 100000, 10% discount)
    const goldMember = { lifetimeSpend: 150000 };
    
    // Plain shopper (bronze tier: no discount)
    const plainShopper = {};

    // Clear cache to ensure clean state
    cachedPriceCart.cache.clear();

    // First call: gold member gets their discounted price
    const goldResult = cachedPriceCart(cart, goldMember);
    
    // Second call: plain shopper should get their own price, not the cached gold price
    const plainResult = cachedPriceCart(cart, plainShopper);

    // From the report: gold member gets $69.45 with $4.88 knocked off
    expect(goldResult.total).toBe(6945);
    expect(goldResult.memberDiscount).toBe(488);
    
    // From the report: plain shopper should get $74.33 (no member discount)
    // The $4.88 difference confirms the member discount is the only variable
    expect(plainResult.total).toBe(7433);
    expect(plainResult.memberDiscount).toBe(0);
    
    // Verify they are different
    expect(plainResult.total).not.toBe(goldResult.total);
  });
});
