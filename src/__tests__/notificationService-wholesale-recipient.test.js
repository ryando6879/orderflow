const { describe, it, expect } = require('@jest/globals');
const { recipientFor } = require('../services/notificationService');

describe('recipientFor', () => {
  it('returns primary contact email when customer has a primary contact', () => {
    const customer = {
      id: 'CUST-1001',
      email: 'accounts@retailcustomer.com',
      contacts: [
        { kind: 'primary', email: 'john@retailcustomer.com' },
        { kind: 'billing', email: 'billing@retailcustomer.com' }
      ]
    };
    expect(recipientFor(customer)).toBe('john@retailcustomer.com');
  });

  it('returns account email when customer has no primary contact (wholesale account)', () => {
    const customer = {
      id: 'CUST-2001',
      email: 'payables@wholesalecustomer.com',
      contacts: [
        { kind: 'billing', email: 'ap@wholesalecustomer.com' }
      ]
    };
    expect(recipientFor(customer)).toBe('payables@wholesalecustomer.com');
  });

  it('returns account email when customer has empty contacts array', () => {
    const customer = {
      id: 'CUST-2002',
      email: 'orders@tradecustomer.com',
      contacts: []
    };
    expect(recipientFor(customer)).toBe('orders@tradecustomer.com');
  });

  it('returns account email when customer has no contacts property', () => {
    const customer = {
      id: 'CUST-2003',
      email: 'contact@businesscustomer.com'
    };
    expect(recipientFor(customer)).toBe('contact@businesscustomer.com');
  });

  it('returns account email when contacts exist but none are primary', () => {
    const customer = {
      id: 'CUST-2004',
      email: 'info@company.com',
      contacts: [
        { kind: 'billing', email: 'billing@company.com' },
        { kind: 'shipping', email: 'warehouse@company.com' }
      ]
    };
    expect(recipientFor(customer)).toBe('info@company.com');
  });
});
