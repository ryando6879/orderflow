// Server-rendered order tracking page. The storefront serves this HTML at
// /orders/:id/tracking; public/styles.css supplies the visual styling.

const { trackingModel } = require("./tracking");

/**
 * Class list for a journey step's <li>, keyed by the step's state.
 *
 * Contract: the state modifier classes must match the ones defined in
 * public/styles.css — the stylesheet is the source of truth, and a class it
 * doesn't define silently renders in the default grey (no warning anywhere).
 */
const STATE_CLASS = {
  done: "step step-complete",
  current: "step step--current",
  todo: "step",
};

/**
 * Renders the tracking page for an order as a complete HTML document.
 *
 * @param {{ id: string, events: { status: string, at: string }[] }} order
 * @returns {string} the HTML document
 */
function renderTrackingPage(order) {
  const { steps, percent } = trackingModel(order);
  const items = steps
    .map((s) => `        <li class="${STATE_CLASS[s.state]}">${s.label}</li>`)
    .join("\n");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Tracking ${order.id}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="tracking-page">
      <h1>Order ${order.id}</h1>
      <ol class="tracking-steps">
${items}
      </ol>
      <div class="progress">
        <div class="progress__fill" style="width: ${percent}%"></div>
      </div>
    </main>
  </body>
</html>`;
}

module.exports = { renderTrackingPage, STATE_CLASS };

if (require.main === module) {
  // ORD-2107 shipped this morning, but the warehouse's "processing" webhook
  // was delayed and arrived after the carrier's "shipped" event.
  const order = {
    id: "ORD-2107",
    events: [
      { status: "placed", at: "2026-07-08T10:00:00Z" },
      { status: "shipped", at: "2026-07-08T14:05:00Z" },
      { status: "processing", at: "2026-07-08T11:30:00Z" },
    ],
  };
  const html = renderTrackingPage(order);
  const model = trackingModel(order);
  const current = model.steps.find((s) => s.state === "current");
  console.log(`tracking page for ${order.id}:`);
  console.log("  showing step:", current.label);
  console.log("  progress fill:", `${model.percent}%`);
  for (const s of model.steps) {
    console.log(`  ${s.label}: class "${STATE_CLASS[s.state]}"`);
  }
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(
    path.join(__dirname, "..", "public", "styles.css"),
    "utf8"
  );
  const defined = new Set(
    [...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1])
  );
  const rendered = new Set(
    [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/))
  );
  const missing = [...rendered].filter((c) => !defined.has(c));
  console.log(
    "  classes missing from stylesheet:",
    missing.length ? missing.join(", ") : "none"
  );
}
