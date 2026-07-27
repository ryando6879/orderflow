import { describe, it, expect } from "vitest";
import { shippingSummary } from "../src/http/routes/orders.js";

describe("shippingSummary", () => {
  it('returns "No shipping" for digital orders with no shipping block (gift cards)', () => {
    const order = {
      id: "ORD-5001",
      number: "GC-20240115-001",
      customerId: "CUST-789",
      status: "paid",
      placedAt: "2024-01-15T10:30:00Z",
      region: "US",
      service: "digital",
      amounts: { total: 5000 },
      refundedTotal: 0,
      riskScore: 0.1,
      reviewHold: false
    };
    expect(shippingSummary(order)).toBe("No shipping");
  });

  it('returns "No shipping" for digital orders with no shipping block (store credit top-ups)', () => {
    const order = {
      id: "ORD-5002",
      number: "CR-20240115-002",
      customerId: "CUST-456",
      status: "paid",
      placedAt: "2024-01-15T11:00:00Z",
      region: "US",
      service: "digital",
      amounts: { total: 10000 },
      refundedTotal: 0,
      riskScore: 0.05,
      reviewHold: false
    };
    expect(shippingSummary(order)).toBe("No shipping");
  });

  it('returns "No shipping" for digital orders with no shipping block (plan credits)', () => {
    const order = {
      id: "ORD-5003",
      number: "PC-20240115-003",
      customerId: "CUST-123",
      status: "paid",
      placedAt: "2024-01-15T12:00:00Z",
      region: "US",
      service: "digital",
      amounts: { total: 2500 },
      refundedTotal: 0,
      riskScore: 0.02,
      reviewHold: false
    };
    expect(shippingSummary(order)).toBe("No shipping");
  });

  it('returns "City, ST 12345" for physical orders with shipping address', () => {
    const order = {
      id: "ORD-5004",
      number: "ORD-20240115-004",
      customerId: "CUST-999",
      status: "paid",
      placedAt: "2024-01-15T13:00:00Z",
      region: "US",
      service: "standard",
      shipping: {
        address: {
          city: "Portland",
          state: "OR",
          zip: "97201"
        }
      },
      amounts: { total: 3800 },
      refundedTotal: 0,
      riskScore: 0.3,
      reviewHold: false
    };
    expect(shippingSummary(order)).toBe("Portland, OR 97201");
  });

  it('returns "No shipping" when shipping block exists but address is missing', () => {
    const order = {
      id: "ORD-5005",
      number: "ORD-20240115-005",
      customerId: "CUST-888",
      status: "pending",
      placedAt: "2024-01-15T14:00:00Z",
      region: "US",
      service: "pickup",
      shipping: {},
      amounts: { total: 1900 },
      refundedTotal: 0,
      riskScore: 0.15,
      reviewHold: false
    };
    expect(shippingSummary(order)).toBe("No shipping");
  });
});
