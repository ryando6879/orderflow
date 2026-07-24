// Risk signals used by the fraud score. Each signal contributes points;
// the weights were tuned against last quarter's chargebacks and are
// owned jointly by finance and support.
//
// Positive weights make an order LOOK RISKIER. Negative weights are
// trust signals that pull the score DOWN.

const SIGNAL_WEIGHTS = {
  mismatched_billing_country: 35,
  first_order_high_value: 25,
  many_cards_one_account: 30,
  email_domain_disposable: 40,
  shipping_to_freight_forwarder: 20,
  rush_shipping_on_first_order: 15,
  repeat_customer_in_good_standing: -30,
  address_matches_previous_order: -20,
  account_older_than_year: -15,
};

// Score bands. `review` orders are held for a human; `block` orders are
// declined at checkout.
const REVIEW_AT = 40;
const BLOCK_AT = 75;

/** Points a single signal contributes (0 for signals we do not know). */
function weightOf(signal) {
  return SIGNAL_WEIGHTS[signal] ?? 0;
}

/** Every signal name, for validation and the admin UI. */
function knownSignals() {
  return Object.keys(SIGNAL_WEIGHTS);
}

/** Trust signals (negative weight) present on an order. */
function trustSignals(signals) {
  return signals.filter((signal) => weightOf(signal) < 0);
}

module.exports = { SIGNAL_WEIGHTS, REVIEW_AT, BLOCK_AT, weightOf, knownSignals, trustSignals };
