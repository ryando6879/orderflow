# Architecture

OrderFlow is one Node process. It serves the HTTP API, runs the scheduled jobs,
and holds the data. That is a deliberate choice for our size, and this document
says where the seams are so that splitting it later is mechanical rather than
archaeological.

## Layers

```
        HTTP (src/http)
             │  routes → middleware → handler
             ▼
      services (src/services)      ← use cases, orchestration, side effects
             │
             ├────────────► domain (src/domain)        ← pure rules, no I/O
             │
             └────────────► repositories (src/repositories)
                                    │
                                    ▼
                              db (src/db/store.js)
```

Rules:

- **`domain/` is pure.** No I/O, no clock reads that are not passed in, no
  imports from `services/` or `repositories/`. Everything here is unit-testable
  with plain values: money arithmetic, tax rules, the order state machine,
  stock accounting, the SLA clock.
- **`repositories/` is the only code that touches the store.** They speak rows.
  A service that needs data asks a repository.
- **`services/` owns use cases** and is where side effects live: charging a
  card, sending an email, writing several tables for one operation.
- **`http/` is thin.** A handler validates, calls one service, and renders. Any
  handler with business logic in it is a handler that wants a service.
- **`integrations/` wraps every outbound call.** Nothing else calls `fetch`.

The flat modules at the top of `src/` predate the layers and hold the original
pricing rules (`cart.js`, `quote.js`, `invoice.js`, `loyalty.js`,
`promotions.js`, `shipping.js`, `proration.js`, `businessDays.js`, …). Treat
them as `domain/`: the layered code calls into them, never the other way round.

## Why no framework

The API is about thirty routes with one shape (JSON in, JSON out). A hand-rolled
router (`src/http/router.js`, ~90 lines) and a middleware list
(`src/http/app.js`) cover it, and the dependency tree stays empty — which is
most of the reason `npm install` takes two seconds and a CVE in an Express
transitive dependency is not our afternoon. If we ever need content
negotiation, streaming uploads or websockets, this is the decision to revisit
first.

## Persistence

`src/db/store.js` is a set of `Map`s, one per table, with a Postgres-shaped API
(`get`/`put`/`patch`/`remove`/`all`). It is per-process and lost on restart;
`src/db/seed.js` reloads a realistic dataset on boot outside production.

The table names and row shapes are the ones the Postgres schema will have. When
we move, `store.js` becomes a connection pool and the repositories become SQL —
nothing above them changes. That is the whole point of the layer.

**Consequences to keep in mind today:** there are no transactions, so a service
that writes several tables can be interrupted halfway (checkout reserves stock
before it charges for exactly this reason); and there is no cross-instance
state, so anything shared has to live in the store rather than in
`src/lib/cache.js`.

## HTTP request path

1. `requestId` — take or mint `x-request-id`, attach a child logger
2. `requestLogger` — one access line per request, on `finish`
3. `rateLimit` — fixed-window counter per client address (it runs ahead of
   `authenticate`, so the key is not known yet)
4. body read + JSON parse (512 KB cap)
5. `authenticate` — API key from `x-api-key`, unless the path is public
6. route resolution, then that route's middleware (`requireScope`, `validate`)
7. the handler
8. anything thrown lands in `errorHandler`

Public paths are `/health*` and `/webhooks/*`. Webhooks authenticate with the
provider's HMAC signature instead of a key — see
`src/integrations/webhookSignature.js`. Those endpoints are reachable by
anyone, so every code path they touch has to survive a hostile request.

## Jobs

`src/jobs/scheduler.js` runs five jobs on `setInterval` inside the API process:

| job | interval | what it does |
| --- | --- | --- |
| `expire-reservations` | 5m | release stock held by dead carts |
| `abandoned-cart-sweep` | 15m | email shoppers who went quiet |
| `renew-subscriptions` | 1h | charge the next period |
| `dunning-run` | 6h | retry failed subscription charges |
| `reconcile-payouts` | 24h | compare provider payouts to our orders |

Every job must be idempotent and must take its clock as an argument so tests
can drive it. A job that throws is caught, logged and alerted; it never takes
the process down.

## Idempotency

Two separate mechanisms, for two separate problems:

- **Inbound webhooks** (`repositories/webhookEventRepo.js`) — providers deliver
  at least once, so an event id is applied exactly once.
- **Client writes** (`lib/idempotency.js`) — the storefront retries on timeouts,
  so a replayed checkout returns the first response instead of placing a second
  order.

## Configuration

`src/config/index.js` reads the environment once at boot into a nested object.
Everything has a development default. Feature flags
(`src/config/featureFlags.js`) are read per call so they can be flipped without
a restart, and are meant to be short-lived.

## Observability

Structured JSON logs on stdout/stderr (`src/lib/logger.js`), one line per
request plus whatever the handlers add, all carrying `requestId`. Operational
alerts go to `#orders-alerts` via `src/integrations/slackAlerts.js`. There are
no metrics yet; the access log is the closest thing we have to latency data.
