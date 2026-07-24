# API reference

Base URL in production is `https://api.orderflow.example`. Everything is JSON.

## Authentication

Send your key in `x-api-key`:

```bash
curl -s https://api.orderflow.example/v1/orders -H 'x-api-key: of_live_…'
```

Keys carry scopes: `carts:write`, `checkout:write`, `orders:read`,
`orders:write`, `refunds:write`, `reports:read`, `admin`. An `admin` key passes
any scope check. A revoked key is rejected on the next request it makes.

Storefront requests also send `x-customer-id` so the pricing layer can apply the
signed-in shopper's member discount.

`/health*` and `/webhooks/*` need no key.

## Conventions

- **Money is integer cents.** `2652` is $26.52. There are no floats in any
  request or response body.
- **Pages are 1-based.** `?page=1` is the first page; `page` defaults to 1 and
  `limit` to 25 (max 100). List responses come back as
  `{ data: [...], page: { number, size, total, pages, hasNext } }`.
- **Errors** are `{ error: { code, message, requestId } }`. Quote the
  `requestId` to support — it is in the logs.
- **Idempotency**: send `Idempotency-Key` on `POST /v1/checkout`. A replay
  returns `200` with the original body and `replayed: true` instead of `201`.
- **Rate limit**: 120 requests/minute per client address, fixed window — the
  limiter runs ahead of authentication, so callers sharing an address share a
  budget. Over the limit you get `429` with `Retry-After` in seconds.

## Errors

| code | status | meaning |
| --- | --- | --- |
| `missing_api_key` / `invalid_api_key` | 401 | key absent, unknown or revoked |
| `missing_scope` | 403 | the key lacks the scope for this route |
| `not_found` | 404 | no such order, cart, customer or subscription |
| `invalid_request` | 400/422 | body is not JSON, or failed validation |
| `invalid_transition` | 409 | the order cannot move to that state |
| `out_of_stock` | 409 | not enough units to promise |
| `declined` | 402 | fraud screening blocked the order |
| `refund_exceeds_balance` | 422 | refund is bigger than what is left |
| `rate_limited` | 429 | slow down |
| `internal_error` | 500 | our bug — quote the request id |

## Health

```
GET /health              → { status, env, bootedAt }
GET /health/ready        → { status, tables: { orders: 4, … } }
GET /v1/routes           → { routes: ["GET /health", …] }
GET /v1/flags            → { flags: { regionalTax: true, … } }
```

## Carts

```
POST   /v1/carts                 { sessionId, customerId?, region?, items? }
GET    /v1/carts/:id
POST   /v1/carts/:id/items       { sku, qty }
POST   /v1/carts/:id/gift        { giftWrap, giftNote? }
DELETE /v1/carts/:id
```

A cart response carries the priced cart, per-line availability and the
free-shipping banner state:

```json
{
  "id": "cart_9f2a…",
  "items": [{ "sku": "TEE-1", "qty": 2, "subtotal": 3800, "available": 12 }],
  "pricing": {
    "merchandise": 3800, "discount": 0, "promo": null,
    "shipping": 700, "tax": 304, "taxLabel": "Sales tax (8.00%)",
    "total": 4804
  },
  "freeShipping": { "unlocked": false, "remaining": 1200, "message": "You're $12.00 away from free shipping" }
}
```

## Checkout

```
POST /v1/checkout        { cartId, customerId, paymentMethodId, service?,
                           address?, billingCountry?, shippingCountry? }
POST /v1/checkout/quote  { items, region?, member? }
```

`POST /v1/checkout` prices the cart, screens it for fraud, reserves stock,
charges the card and creates the order — in that order. An order caught in the
review band comes back with `reviewHold: true` and is not charged until a human
releases it.

## Orders

```
GET  /v1/orders?status=&region=&page=&limit=
GET  /v1/orders/:id
GET  /v1/orders/by-number/:number
GET  /v1/customers/:id/orders/recent?limit=
POST /v1/orders/:id/cancel        { reason? }
POST /v1/orders/:id/fulfil        { warehouseId, carrier, trackingNumber }
```

Order states: `pending → paid → fulfilled → closed`, with `cancelled`,
`partially_refunded` and `refunded` off to the side. The legal moves are in
`src/domain/orderStates.js`.

## Subscriptions (OrderFlow Plus)

```
GET    /v1/plans
POST   /v1/subscriptions               { customerId, planId, paymentMethodId }
GET    /v1/subscriptions/:id
POST   /v1/subscriptions/:id/change    { planId, changeIso?, paymentMethodId? }
DELETE /v1/subscriptions/:id           (cancels at period end)
```

A mid-period change credits the unused part of the old plan and charges the
remaining part of the new one; the response shows `credit`, `charge` and `net`.

## Admin

Needs `reports:read`, `refunds:write` or `admin`.

```
GET  /admin/reports/revenue?from=&to=
GET  /admin/reports/revenue-by-region?from=&to=
GET  /admin/exports/orders.csv?from=&to=
GET  /admin/orders/:id/refundable
POST /admin/orders/:id/refunds     { amountCents, reason?, lines? }
GET  /admin/stock/:sku
GET  /admin/flags
POST /admin/search/rebuild
```

Revenue figures exclude cancelled and fully refunded orders, so the export
reconciles against the payment provider's payout report.

## Webhooks (inbound)

```
POST /webhooks/payments
POST /webhooks/carrier
```

Signed with `OF-Signature: t=<unix>,v1=<hex>` — HMAC-SHA256 of
`${timestamp}.${rawBody}` with the shared secret, within a 5-minute tolerance.
Both providers deliver at least once; every event id is applied exactly once.
Handled payment types: `charge.succeeded`, `charge.failed`, `charge.refunded`,
`credit.granted`. Anything else is acknowledged and ignored.
