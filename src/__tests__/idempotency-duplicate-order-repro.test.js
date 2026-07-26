const { describe, it, expect, beforeEach } = require('@jest/globals');
const { once, reset } = require('../lib/idempotency');

describe('idempotency - duplicate order bug', () => {
  beforeEach(() => {
    reset();
  });

  it('treats two different order bodies from same customer to same endpoint as distinct requests', async () => {
    const customerId = 'cus_abc123';
    const endpoint = 'POST /v1/checkout';

    // First order: customer buys item A
    const firstRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_001',
        customerId,
        paymentMethodId: 'pm_visa_4242',
        service: 'standard',
        address: { zip: '10001' }
      }
    };

    let firstHandlerCallCount = 0;
    const firstHandler = async () => {
      firstHandlerCallCount++;
      return {
        id: 'ord_first',
        number: 'ORD-ABC123',
        customerId,
        status: 'pending',
        items: [{ sku: 'ITEM-A', quantity: 1 }]
      };
    };

    const firstResult = await once(firstRequest, firstHandler);
    expect(firstResult.replayed).toBe(false);
    expect(firstResult.result.id).toBe('ord_first');
    expect(firstResult.result.number).toBe('ORD-ABC123');
    expect(firstHandlerCallCount).toBe(1);

    // Second order: same customer buys item B (different body)
    const secondRequest = {
      customerId,
      endpoint,
      body: {
        cartId: 'cart_002',
        customerId,
        paymentMethodId: 'pm_visa_4242',
        service: 'express',
        address: { zip: '10001' }
      }
    };

    let secondHandlerCallCount = 0;
    const secondHandler = async () => {
      secondHandlerCallCount++;
      return {
        id: 'ord_second',
        number: 'ORD-XYZ789',
        customerId,
        status: 'pending',
        items: [{ sku: 'ITEM-B', quantity: 1 }]
      };
    };

    const secondResult = await once(secondRequest, secondHandler);

    // The bug: secondResult.replayed is true and result is the first order
    // The fix: secondResult.replayed should be false and result should be the second order
    expect(secondResult.replayed).toBe(false);
    expect(secondResult.result.id).toBe('ord_second');
    expect(secondResult.result.number).toBe('ORD-XYZ789');
    expect(secondHandlerCallCount).toBe(1);
  });

  it('correctly replays identical request body from same customer', async () => {
    const customerId = 'cus_def456';
    const endpoint = 'POST /v1/checkout';
    const body = {
      cartId: 'cart_003',
      customerId,
      paymentMethodId: 'pm_visa_5555',
      service: 'standard',
      address: { zip: '20002' }
    };

    const request = { customerId, endpoint, body };

    let handlerCallCount = 0;
    const handler = async () => {
      handlerCallCount++;
      return {
        id: 'ord_replay_test',
        number: 'ORD-REPLAY1',
        customerId,
        status: 'pending'
      };
    };

    const firstResult = await once(request, handler);
    expect(firstResult.replayed).toBe(false);
    expect(firstResult.result.number).toBe('ORD-REPLAY1');
    expect(handlerCallCount).toBe(1);

    // Replay the exact same request
    const replayResult = await once(request, handler);
    expect(replayResult.replayed).toBe(true);
    expect(replayResult.result.number).toBe('ORD-REPLAY1');
    expect(handlerCallCount).toBe(1); // Handler should not be called again
  });
});
