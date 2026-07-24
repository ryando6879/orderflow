# On-call runbook

Who to wake: whoever is on `#orders-alerts`. Most pages here are about money
moving wrongly, which is worth waking someone for; the rest can wait for
business hours.

## First five minutes

```bash
curl -s $BASE/health            # is it up
curl -s $BASE/health/ready      # does it have data
curl -s $BASE/v1/flags -H "x-api-key: $ADMIN_KEY"
```

Logs are JSON on stdout, one line per request. Every line carries `requestId`;
if a customer quotes one, grep for it first — it gives you the exact path,
status, duration and customer.

## Definitions finance relies on

Get these wrong in an incident and the month-end numbers move:

- **Gross revenue** = sum of `amounts.total` for orders placed in the window,
  **excluding** `cancelled` and `refunded` orders.
- **Net revenue** = gross minus everything successfully refunded against those
  orders. Failed refund attempts do not count — no money moved.
- **Refundable balance** on an order = order total minus what has already gone
  back. Support refunds the same order more than once; the remaining balance is
  the cap, never the original total.
- **Tax** is charged on what the customer actually pays for merchandise, i.e.
  after every discount. Shipping is taxable only in the regions
  `src/domain/taxRules.js` says so.

## "Customers are getting emails they should not"

The abandoned-cart nudge is the usual suspect. A cart is only eligible when it
has been **untouched** for the whole quiet period
(`ABANDONED_CART_AFTER_MINUTES`, default 60) — a shopper who is still browsing
must never get one.

To stop the bleeding: set `ABANDONED_CART_AFTER_MINUTES` very high and restart.
Then check `src/jobs/abandonedCartSweep.js` and the `nudgedAt` stamps.

## "I keep getting 'too many requests'"

The limiter is a **fixed** window: it opens with the first request in it and
clears 60 seconds later, whether or not the caller kept knocking. If a customer
says it never clears no matter how long they wait, the window logic is at fault,
not the customer.

`RATE_LIMIT_PER_MINUTE=0` turns the limiter off entirely — that is the
emergency lever, and it is also how the load tests run.

## "We oversold a SKU"

Available units = `onHand − reserved`. Anything that counts on-hand units
without subtracting reservations will promise the same unit twice.

```bash
curl -s $BASE/admin/stock/TEE-1 -H "x-api-key: $ADMIN_KEY"
```

Compare `onHand`, `reserved` and `available` per warehouse. If `reserved` looks
absurdly high, `expire-reservations` has not been running — dead carts are
holding stock.

## "A payment webhook was applied twice"

Providers deliver **at least once**. Deduplication is by the provider's **event
id**, never by event type: a customer legitimately gets many
`charge.succeeded` and `shipment.updated` events over the life of an order.

Check `webhook_events` for the id in question, then the order's ledger.

## "A past-due member was never retried"

Dunning retries on a fixed schedule (1, 3, 5, 7 days) and only cancels after the
budget is spent (`DUNNING_MAX_ATTEMPTS`, default 4). A subscription that stopped
being retried before its budget ran out means the schedule produced no next
attempt date — look at `nextAttemptAt` on the row; if it is missing or invalid,
that is the bug.

## "The payout does not reconcile"

`reconcile-payouts` compares the provider's payout items against our order
totals and alerts on any non-zero difference. A difference that is a round
number of dollars, or that grows with batch size, means our side is losing
precision rather than the provider withholding anything. Everything in that path
must stay in integer cents.

## Provider outages

The outbound client retries **transient** failures only: network errors,
timeouts, `429` and `5xx`. A `4xx` is the provider telling us the request is
wrong — retrying cannot help it, and on a charge endpoint it risks a second
charge. If a provider incident is in progress, raise `HTTP_TIMEOUT_MS` and let
the retries do their work; do not loosen what counts as retryable.

## Feature flags

```
FLAG_REGIONAL_TAX             regional tax table (default on)
FLAG_FRAUD_MANUAL_REVIEW      hold risky orders instead of declining (on)
FLAG_RESERVE_AT_CART          reserve stock at add-to-cart (off)
FLAG_NEW_SHIPMENT_EMAIL       redesigned shipment email (off)
FLAG_LOCAL_SEARCH_INDEX       serve search from the in-process index (on)
```

## Restart

```bash
npm start                 # SIGTERM drains in-flight requests, then exits
```

The store is in-process: a restart loses carts and any order state not yet
pushed to the provider. Prefer draining over killing.
