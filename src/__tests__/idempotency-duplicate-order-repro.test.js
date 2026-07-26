const { describe, it, expect, beforeEach } = require('@jest/globals');
const { requestFingerprint, once, reset } = require('../lib/idempotency');

describe('idempotency - duplicate order detection', () => {
  beforeEach(() => {
    reset();
  });

  it('treats two different order bodies from same customer to same endpoint as distinct requests', async () => {
    // Simulate the reported scenario: customer places order for tee, then mug
    const customerId = 'cus_abc123';
    const endpoint = 'POST /v1/checkout';

    const teeOrderRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_001',
        customerId,
        paymentMethodId: 'pm_card456',
        service: 'standard',
        items: [{ sku: 'TEE-1', qty: 1 }]
      }
    };

    const mugOrderRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_002',
        customerId,
        paymentMethodId: 'pm_card456',
        service: 'standard',
        items: [{ sku: 'MUG-1', qty: 1 }]
      }
    };

    // First order (tee) should execute handler
    let teeHandlerCalled = false;
    const teeResult = await once(teeOrderRequest, async () => {
      teeHandlerCalled = true;
      return { orderId: 'ord_tee_001', items: [{ sku: 'TEE-1', qty: 1 }] };
    });

    expect(teeHandlerCalled).toBe(true);
    expect(teeResult.replayed).toBe(false);
    expect(teeResult.result.orderId).toBe('ord_tee_001');

    // Second order (mug) should ALSO execute handler (not be treated as replay)
    let mugHandlerCalled = false;
    const mugResult = await once(mugOrderRequest, async () => {
      mugHandlerCalled = true;
      return { orderId: 'ord_mug_002', items: [{ sku: 'MUG-1', qty: 1 }] };
    });

    // The bug: mugResult.replayed would be true and result would be the tee order
    // Correct behavior: mugHandlerCalled should be true, replayed should be false
    expect(mugHandlerCalled).toBe(true);
    expect(mugResult.replayed).toBe(false);
    expect(mugResult.result.orderId).toBe('ord_mug_002');
    expect(mugResult.result.items[0].sku).toBe('MUG-1');
  });

  it('generates different fingerprints for different request bodies to same endpoint', () => {
    const customerId = 'cus_abc123';
    const endpoint = 'POST /v1/checkout';

    const teeFingerprint = requestFingerprint({
      customerId,
      endpoint,
      body: {
        cartId: 'cart_001',
        items: [{ sku: 'TEE-1', qty: 1 }]
      }
    });

    const mugFingerprint = requestFingerprint({
      customerId,
      endpoint,
      body: {
        cartId: 'cart_002',
        items: [{ sku: 'MUG-1', qty: 1 }]
      }
    });

    // Per the contract (lines 19-23), different bodies must produce different fingerprints
    expect(teeFingerprint).not.toBe(mugFingerprint);
  });

  it('generates same fingerprint for identical request bodies (true replay)', () => {
    const customerId = 'cus_abc123';
    const endpoint = 'POST /v1/checkout';
    const body = {
      cartId: 'cart_001',
      items: [{ sku: 'TEE-1', qty: 1 }]
    };

    const fingerprint1 = requestFingerprint({ customerId, endpoint, body });
    const fingerprint2 = requestFingerprint({ customerId, endpoint, body });

    expect(fingerprint1).toBe(fingerprint2);
  });
});
