const { describe, it, expect, beforeEach } = require('@jest/globals');
const { once, reset } = require('../lib/idempotency');

describe('idempotency', () => {
  beforeEach(() => {
    reset();
  });

  it('processes two different orders from the same customer as separate requests', async () => {
    const customerId = 'cus_abc123';
    const endpoint = '/v1/orders';

    // First order
    const firstOrderBody = {
      items: [{ sku: 'WIDGET-001', quantity: 2 }],
      shippingAddress: { street: '123 Main St', city: 'Portland' }
    };
    let orderCounter = 1;
    const firstResult = await once(
      { customerId, endpoint, body: firstOrderBody },
      async () => ({ orderNumber: `ORD-FIRST${orderCounter++}`, total: 50.00 })
    );

    // Second order with different body
    const secondOrderBody = {
      items: [{ sku: 'GADGET-002', quantity: 1 }],
      shippingAddress: { street: '456 Oak Ave', city: 'Seattle' }
    };
    const secondResult = await once(
      { customerId, endpoint, body: secondOrderBody },
      async () => ({ orderNumber: `ORD-SECOND${orderCounter++}`, total: 75.00 })
    );

    // Both should be processed (not replayed)
    expect(firstResult.replayed).toBe(false);
    expect(secondResult.replayed).toBe(false);

    // Each should have its own order number
    expect(firstResult.result.orderNumber).toBe('ORD-FIRST1');
    expect(secondResult.result.orderNumber).toBe('ORD-SECOND2');

    // The second order should NOT return the first order's result
    expect(secondResult.result.orderNumber).not.toBe(firstResult.result.orderNumber);
    expect(secondResult.result.total).toBe(75.00);
  });

  it('replays identical request from same customer to same endpoint', async () => {
    const customerId = 'cus_xyz789';
    const endpoint = '/v1/orders';
    const orderBody = {
      items: [{ sku: 'WIDGET-001', quantity: 2 }],
      shippingAddress: { street: '123 Main St', city: 'Portland' }
    };

    let callCount = 0;
    const handler = async () => {
      callCount++;
      return { orderNumber: `ORD-REPLAY${callCount}`, total: 50.00 };
    };

    const firstResult = await once(
      { customerId, endpoint, body: orderBody },
      handler
    );

    // Exact same request again (true replay)
    const secondResult = await once(
      { customerId, endpoint, body: orderBody },
      handler
    );

    expect(firstResult.replayed).toBe(false);
    expect(secondResult.replayed).toBe(true);
    expect(callCount).toBe(1); // Handler called only once
    expect(secondResult.result.orderNumber).toBe(firstResult.result.orderNumber);
  });
});
