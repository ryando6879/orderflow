const { describe, it, expect, beforeEach } = require('@jest/globals');
const { once, reset } = require('../lib/idempotency');

describe('idempotency - second order repro', () => {
  beforeEach(() => {
    reset();
  });

  it('processes two different orders from the same customer as separate requests', async () => {
    const customerId = 'cus_abc123';
    const endpoint = 'POST /v1/checkout';

    // First order - customer buys item A
    const firstRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_001',
        customerId,
        paymentMethodId: 'pm_card_visa',
        service: 'standard',
        address: { zip: '12345' }
      }
    };

    let firstHandlerCalls = 0;
    const firstResult = await once(firstRequest, async () => {
      firstHandlerCalls++;
      return {
        orderNumber: 'ORD-ABC123',
        items: [{ sku: 'ITEM-A', quantity: 1 }],
        total: 5000
      };
    });

    expect(firstHandlerCalls).toBe(1);
    expect(firstResult.replayed).toBe(false);
    expect(firstResult.result.orderNumber).toBe('ORD-ABC123');

    // Second order - same customer buys item B (different cart, different items)
    const secondRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_002',
        customerId,
        paymentMethodId: 'pm_card_visa',
        service: 'express',
        address: { zip: '12345' }
      }
    };

    let secondHandlerCalls = 0;
    const secondResult = await once(secondRequest, async () => {
      secondHandlerCalls++;
      return {
        orderNumber: 'ORD-XYZ789',
        items: [{ sku: 'ITEM-B', quantity: 2 }],
        total: 8000
      };
    });

    // The bug: secondHandlerCalls is 0 because the handler never runs
    // The bug: secondResult.replayed is true (incorrectly treated as replay)
    // The bug: secondResult.result returns the FIRST order's data
    expect(secondHandlerCalls).toBe(1);
    expect(secondResult.replayed).toBe(false);
    expect(secondResult.result.orderNumber).toBe('ORD-XYZ789');
    expect(secondResult.result.items).toEqual([{ sku: 'ITEM-B', quantity: 2 }]);
    expect(secondResult.result.total).toBe(8000);
  });

  it('correctly replays an identical request (true idempotency)', async () => {
    const request = {
      customerId: 'cus_def456',
      endpoint: 'POST /v1/checkout',
      body: {
        cartId: 'cart_003',
        customerId: 'cus_def456',
        paymentMethodId: 'pm_card_mastercard'
      }
    };

    let handlerCalls = 0;
    const handler = async () => {
      handlerCalls++;
      return { orderNumber: 'ORD-REPLAY1', total: 3000 };
    };

    const first = await once(request, handler);
    expect(handlerCalls).toBe(1);
    expect(first.replayed).toBe(false);

    // Exact same request - should replay
    const second = await once(request, handler);
    expect(handlerCalls).toBe(1); // handler not called again
    expect(second.replayed).toBe(true);
    expect(second.result.orderNumber).toBe('ORD-REPLAY1');
  });
});
