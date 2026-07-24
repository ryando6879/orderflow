// Feature flags. Flags are read per call (not cached) so ops can flip one
// with a rolling restart-free config reload. Flags are meant to be
// short-lived — anything here for more than a quarter should either be
// removed or become real configuration.

const { boolFromEnv } = require("./index");

const FLAGS = {
  // Route quotes through the new tax table rather than the flat rate.
  regionalTax: () => boolFromEnv("FLAG_REGIONAL_TAX", true),
  // Hold risky orders for manual review instead of declining them.
  fraudManualReview: () => boolFromEnv("FLAG_FRAUD_MANUAL_REVIEW", true),
  // Reserve stock at add-to-cart time rather than at checkout.
  reserveAtCart: () => boolFromEnv("FLAG_RESERVE_AT_CART", false),
  // Send the redesigned shipment-notification email.
  newShipmentEmail: () => boolFromEnv("FLAG_NEW_SHIPMENT_EMAIL", false),
  // Serve the search results page from the in-process index.
  localSearchIndex: () => boolFromEnv("FLAG_LOCAL_SEARCH_INDEX", true),
};

/** Whether a flag is on. Unknown flags are off. */
function isEnabled(name) {
  const flag = FLAGS[name];
  return flag ? flag() : false;
}

/** Snapshot of every flag, for /admin/flags and for support tickets. */
function snapshot() {
  return Object.fromEntries(Object.keys(FLAGS).map((name) => [name, isEnabled(name)]));
}

module.exports = { FLAGS, isEnabled, snapshot };
