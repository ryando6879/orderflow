import { describe, it, expect } from "vitest";
import { giftCardText } from "../giftMessage.js";

describe('giftCardText', () => {
  it('returns trimmed gift message for gift orders', () => {
    const order = { id: 'ORD-3101', giftMessage: '  Happy birthday, Maya!  ' };
    expect(giftCardText(order)).toBe('Happy birthday, Maya!');
  });

  it('returns empty string for non-gift orders (no giftMessage property)', () => {
    const order = { id: 'ORD-3102' };
    expect(giftCardText(order)).toBe('');
  });

  it('returns empty string when giftMessage is null', () => {
    const order = { id: 'ORD-3103', giftMessage: null };
    expect(giftCardText(order)).toBe('');
  });

  it('returns empty string when giftMessage is undefined', () => {
    const order = { id: 'ORD-3104', giftMessage: undefined };
    expect(giftCardText(order)).toBe('');
  });

  it('returns empty string when giftMessage is empty string', () => {
    const order = { id: 'ORD-3105', giftMessage: '' };
    expect(giftCardText(order)).toBe('');
  });

  it('returns empty string when giftMessage is only whitespace', () => {
    const order = { id: 'ORD-3106', giftMessage: '   ' };
    expect(giftCardText(order)).toBe('');
  });

  it('processes mixed queue of gift and non-gift orders without throwing', () => {
    const queue = [
      { id: 'ORD-3101', giftMessage: '  Happy birthday, Maya!  ' },
      { id: 'ORD-3102' },
      { id: 'ORD-3103', giftMessage: 'Enjoy!' }
    ];
    
    const results = queue.map(order => ({
      id: order.id,
      card: giftCardText(order)
    }));
    
    expect(results).toEqual([
      { id: 'ORD-3101', card: 'Happy birthday, Maya!' },
      { id: 'ORD-3102', card: '' },
      { id: 'ORD-3103', card: 'Enjoy!' }
    ]);
  });
});
