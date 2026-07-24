# Contributing

## Before you push

```bash
npm test
```

CI runs the same command on Node 18 and 20. A red suite does not merge.

## The shape of a change

- **Put rules in `src/domain/`.** If a change is about *what is correct* —
  rounding, eligibility, which states follow which — it belongs in a pure
  module with a unit test, not in a handler.
- **One service per use case.** Handlers validate and render; they do not
  orchestrate.
- **Write the contract in the JSDoc.** Anything a reader could reasonably get
  wrong (inclusive vs exclusive, 1-based vs 0-based, what happens on the empty
  or missing case) goes in the docstring above the function. The docstring is
  the spec that reviewers and on-call read.
- **Integer cents.** Always.
- **Test the edges, not just the happy path.** The bugs that reach customers
  live in the empty list, the missing optional field, the zero, the second page,
  the redelivered webhook, the second refund.

## Style

Plain CommonJS, no transpiler, no framework. Two-space indent, double quotes,
semicolons. Prefer a small named function to a clever expression. Comments
explain *why*; the code already says *what*.

## Tests

One file per module, named after it (`test/domain-money.test.js`). Vitest, no
mocking library — the code exposes seams instead:

- `setTransport()` in `src/integrations/httpClient.js` swaps the transport
- jobs take their clock (`nowMs` / `nowIso`) as an argument
- `resetStore()` from `src/db/reset.js` empties the store between cases

## Commits and PRs

Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
`chore:`). One logical change per PR. If a change affects money, say in the PR
body which number moves and by how much.
