// Development seed data. `npm run seed` loads a small but realistic
// dataset: a handful of customers with different loyalty tiers, orders in
// every lifecycle state, stock across two warehouses, and a couple of
// subscriptions — enough to click through every page locally.

const store = require("./store");
const customerRepo = require("../repositories/customerRepo");
const orderRepo = require("../repositories/orderRepo");
const cartRepo = require("../repositories/cartRepo");
const productRepo = require("../repositories/productRepo");
const subscriptionRepo = require("../repositories/subscriptionRepo");

const CUSTOMERS = [
  {
    id: "cus_ada",
    email: "ada@example.test",
    name: "Ada Okafor",
    lifetimeSpend: 182_00,
    createdAt: "2024-11-02T10:00:00.000Z",
    contacts: [
      { kind: "primary", email: "ada@example.test", phone: "+15550100" },
      { kind: "billing", email: "ap@okafor-studio.test" },
    ],
  },
  {
    id: "cus_ben",
    email: "ben@example.test",
    name: "Ben Iyer",
    lifetimeSpend: 1_450_00,
    createdAt: "2023-06-14T09:30:00.000Z",
    contacts: [{ kind: "primary", email: "ben@example.test", phone: "+15550111" }],
  },
  {
    id: "cus_cleo",
    email: "cleo@example.test",
    name: "Cleo Marsh",
    lifetimeSpend: 0,
    createdAt: "2026-07-01T08:00:00.000Z",
    // A wholesale account: invoices go to accounts payable, and there is
    // no personal "primary" contact on the record.
    contacts: [{ kind: "billing", email: "ap@marsh-retail.test" }],
  },
];

const STOCK = [
  { sku: "TEE-1", warehouseId: "east-1", onHand: 40, reserved: 6 },
  { sku: "MUG-1", warehouseId: "east-1", onHand: 12, reserved: 12 },
  { sku: "HAT-1", warehouseId: "east-1", onHand: 0, reserved: 0 },
  { sku: "STK-1", warehouseId: "east-1", onHand: 60, reserved: 3 },
  { sku: "TEE-1", warehouseId: "west-1", onHand: 18, reserved: 2 },
  { sku: "MUG-1", warehouseId: "west-1", onHand: 5, reserved: 1 },
  { sku: "STK-1", warehouseId: "west-1", onHand: 30, reserved: 0 },
];

function orderFixture({ id, number, customerId, status, placedAt, lines, region, service, amounts, shipping }) {
  return {
    id,
    number,
    customerId,
    status,
    placedAt,
    updatedAt: placedAt,
    lines,
    region,
    service,
    amounts,
    shipping,
    refundedTotal: 0,
  };
}

const ORDERS = [
  orderFixture({
    id: "ord_1001",
    number: "ORD-7K4M2Q",
    customerId: "cus_ada",
    status: "fulfilled",
    placedAt: "2026-06-02T14:05:00.000Z",
    region: "us",
    service: "standard",
    lines: [{ sku: "TEE-1", qty: 2, unitPrice: 1900 }],
    amounts: { merchandise: 3800, discount: 0, tax: 304, shipping: 700, total: 4804 },
    shipping: { address: { line1: "12 Bramble Way", city: "Austin", state: "TX", zip: "78701" } },
  }),
  orderFixture({
    id: "ord_1002",
    number: "ORD-3J9P7T",
    customerId: "cus_ben",
    status: "paid",
    placedAt: "2026-07-11T16:40:00.000Z",
    region: "us-ca",
    service: "express",
    lines: [
      { sku: "MUG-1", qty: 1, unitPrice: 1200 },
      { sku: "STK-1", qty: 3, unitPrice: 600 },
    ],
    amounts: { merchandise: 3000, discount: 300, tax: 223, shipping: 1200, total: 4123 },
    shipping: { address: { line1: "890 Sutter St", city: "San Francisco", state: "CA", zip: "94109" } },
  }),
  orderFixture({
    id: "ord_1003",
    number: "ORD-5H2N8R",
    customerId: "cus_ada",
    status: "pending",
    placedAt: "2026-07-19T11:12:00.000Z",
    region: "us",
    service: "standard",
    lines: [{ sku: "STK-1", qty: 1, unitPrice: 600 }],
    amounts: { merchandise: 600, discount: 0, tax: 48, shipping: 400, total: 1048 },
    shipping: { address: { line1: "12 Bramble Way", city: "Austin", state: "TX", zip: "78701" } },
  }),
  // A gift-card order: nothing ships, so the row carries no shipping block.
  orderFixture({
    id: "ord_1004",
    number: "ORD-9Q3V4L",
    customerId: "cus_cleo",
    status: "paid",
    placedAt: "2026-07-20T09:02:00.000Z",
    region: "us",
    service: "digital",
    lines: [{ sku: "GIFT-25", qty: 1, unitPrice: 2500 }],
    amounts: { merchandise: 2500, discount: 0, tax: 0, shipping: 0, total: 2500 },
    shipping: undefined,
  }),
];

const SUBSCRIPTIONS = [
  {
    id: "sub_ben_pro",
    customerId: "cus_ben",
    planId: "pro",
    status: "active",
    currentPeriodStart: "2026-07-01T00:00:00.000Z",
    currentPeriodEnd: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "sub_ada_basic",
    customerId: "cus_ada",
    planId: "basic",
    status: "past_due",
    currentPeriodStart: "2026-06-15T00:00:00.000Z",
    currentPeriodEnd: "2026-07-15T00:00:00.000Z",
    dunningAttempts: 2,
    lastPaymentError: "card_declined",
  },
];

const CARTS = [
  {
    id: "cart_live_1",
    sessionId: "sess_9a71",
    customerId: "cus_ada",
    region: "us",
    items: [{ sku: "HAT-1", qty: 1 }],
    createdAt: "2026-07-21T18:00:00.000Z",
    updatedAt: "2026-07-21T18:04:00.000Z",
  },
  {
    id: "cart_stale_1",
    sessionId: "sess_2b40",
    region: "us",
    items: [{ sku: "TEE-1", qty: 1 }],
    createdAt: "2026-07-18T12:00:00.000Z",
    updatedAt: "2026-07-18T12:09:00.000Z",
  },
];

/** Load the seed dataset, replacing whatever is in the store. */
function seed() {
  store.truncateAll();
  CUSTOMERS.forEach(customerRepo.create);
  STOCK.forEach(productRepo.putStock);
  ORDERS.forEach(orderRepo.create);
  SUBSCRIPTIONS.forEach(subscriptionRepo.create);
  CARTS.forEach(cartRepo.create);
  return {
    customers: CUSTOMERS.length,
    stock: STOCK.length,
    orders: ORDERS.length,
    subscriptions: SUBSCRIPTIONS.length,
    carts: CARTS.length,
  };
}

module.exports = { seed, CUSTOMERS, ORDERS, STOCK, SUBSCRIPTIONS, CARTS };

if (require.main === module) {
  console.log("seeded:", seed());
}
