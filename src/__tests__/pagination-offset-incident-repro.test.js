const { describe, it, expect } = require('@jest/globals');
const { pageRequest, offsetFor, paginate } = require('../lib/pagination');

describe('pagination offsetFor', () => {
  it('returns 0 for page 1 (first page skips nothing)', () => {
    expect(offsetFor(1, 25)).toBe(0);
  });

  it('returns limit for page 2 (second page skips one full page)', () => {
    expect(offsetFor(2, 25)).toBe(25);
  });

  it('returns 2*limit for page 3', () => {
    expect(offsetFor(3, 25)).toBe(50);
  });

  it('works with different page sizes', () => {
    expect(offsetFor(1, 10)).toBe(0);
    expect(offsetFor(2, 10)).toBe(10);
    expect(offsetFor(1, 2)).toBe(0);
    expect(offsetFor(2, 2)).toBe(2);
  });
});

describe('pagination paginate - admin orders list symptom', () => {
  it('returns first 25 rows for page 1 with default limit when total is 4', () => {
    const orders = [
      { id: 'ord_4', number: 'ORD-4', placedAt: '2024-01-04T10:00:00Z' },
      { id: 'ord_3', number: 'ORD-3', placedAt: '2024-01-03T10:00:00Z' },
      { id: 'ord_2', number: 'ORD-2', placedAt: '2024-01-02T10:00:00Z' },
      { id: 'ord_1', number: 'ORD-1', placedAt: '2024-01-01T10:00:00Z' }
    ];
    const request = pageRequest({ page: 1 });
    const result = paginate(orders, request);

    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].id).toBe('ord_4');
    expect(result.rows[3].id).toBe('ord_1');
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });

  it('returns first 2 rows for page 1 with limit 2 when total is 4', () => {
    const orders = [
      { id: 'ord_4', number: 'ORD-4', placedAt: '2024-01-04T10:00:00Z' },
      { id: 'ord_3', number: 'ORD-3', placedAt: '2024-01-03T10:00:00Z' },
      { id: 'ord_2', number: 'ORD-2', placedAt: '2024-01-02T10:00:00Z' },
      { id: 'ord_1', number: 'ORD-1', placedAt: '2024-01-01T10:00:00Z' }
    ];
    const request = pageRequest({ page: 1, limit: 2 });
    const result = paginate(orders, request);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].id).toBe('ord_4');
    expect(result.rows[1].id).toBe('ord_3');
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(true);
  });

  it('returns next 2 rows for page 2 with limit 2 when total is 4', () => {
    const orders = [
      { id: 'ord_4', number: 'ORD-4', placedAt: '2024-01-04T10:00:00Z' },
      { id: 'ord_3', number: 'ORD-3', placedAt: '2024-01-03T10:00:00Z' },
      { id: 'ord_2', number: 'ORD-2', placedAt: '2024-01-02T10:00:00Z' },
      { id: 'ord_1', number: 'ORD-1', placedAt: '2024-01-01T10:00:00Z' }
    ];
    const request = pageRequest({ page: 2, limit: 2 });
    const result = paginate(orders, request);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].id).toBe('ord_2');
    expect(result.rows[1].id).toBe('ord_1');
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(false);
  });

  it('returns empty array for page beyond total pages', () => {
    const orders = [
      { id: 'ord_4', number: 'ORD-4', placedAt: '2024-01-04T10:00:00Z' },
      { id: 'ord_3', number: 'ORD-3', placedAt: '2024-01-03T10:00:00Z' },
      { id: 'ord_2', number: 'ORD-2', placedAt: '2024-01-02T10:00:00Z' },
      { id: 'ord_1', number: 'ORD-1', placedAt: '2024-01-01T10:00:00Z' }
    ];
    const request = pageRequest({ page: 3, limit: 2 });
    const result = paginate(orders, request);

    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(false);
  });
});
