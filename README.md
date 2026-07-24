# OrderFlow

The service behind the OrderFlow storefront: carts and pricing, checkout and
payments, fulfilment and tracking, returns and refunds, and OrderFlow Plus
subscriptions.

One Node process serves the HTTP API and runs the background jobs. There is no
web framework and no external queue — see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for why, and for the layer map.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000, with seeded dev data
npm test
```

Copy `.env.example` to `.env` for anything beyond the defaults. Nothing in the
default config talks to a real provider: payments, email and the carrier all
point at `*.example.test`, and the email client suppresses sends when no API key
is configured.

```bash
curl -s localhost:3000/health
curl -s localhost:3000/v1/orders -H 'x-api-key: of_live_admin'
```

## Layout

```
src/
  server.js          process entry point: HTTP + scheduler + shutdown
  config/            environment parsing and feature flags
  http/              router, middleware, route modules
  services/          use cases — checkout, refunds, reporting, notifications
  domain/            the rules: money, tax, stock, order states, SLA clock
  repositories/      the only code that touches the store
  db/                the store, the dev seed, the reset helper
  jobs/              scheduled work — sweeps, renewals, dunning, reconciliation
  integrations/      outbound HTTP: payments, email, carrier, alerts
  lib/               logging, ids, dates, cache, retry, csv, pagination
test/                one file per module
docs/                architecture, API reference, on-call runbook
```

The modules at the top of `src/` (`cart.js`, `quote.js`, `invoice.js`,
`shipping.js`, `loyalty.js`, …) are the original pricing core. They are still
the source of truth for pricing rules; the layered code above wraps them rather
than reimplementing them.

## Conventions

- **Money is integer cents.** Everywhere. `src/domain/money.js` has the
  helpers; nothing converts to dollars except for display.
- **Every contract is in the JSDoc.** If behaviour is subtle — rounding,
  inclusive/exclusive bounds, what counts as "abandoned" — the docstring says
  so, and the docstring is the spec.
- **Repositories own persistence.** Services never touch `db/store.js`.
- **Jobs are idempotent.** A deploy can interrupt any run.
- **Errors carry `code` and `statusCode`.** The error handler turns those into
  the API's error envelope; anything else becomes a 500.

## Tests

`npm test` runs the whole suite (Vitest, no watch). Tests live in `test/`, one
file per module, and use no mocks beyond the injectable seams the code already
exposes (`setTransport` in the http client, the clock arguments on the jobs).
