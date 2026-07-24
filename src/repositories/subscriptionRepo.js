const store = require("../db/store");
const { filterBy, orderBy } = require("../db/query");

// OrderFlow Plus subscriptions. Rows look like:
//   { id, customerId, planId, status, currentPeriodStart, currentPeriodEnd,
//     cancelAtPeriodEnd, dunningAttempts, lastPaymentError? }

const TABLE = "subscriptions";
const ACTIVE_STATES = ["trialing", "active", "past_due"];

function create(subscription) {
  return store.put(TABLE, { dunningAttempts: 0, cancelAtPeriodEnd: false, ...subscription });
}

function byId(id) {
  return store.get(TABLE, id);
}

function update(id, changes) {
  return store.patch(TABLE, id, changes);
}

/** The customer's live subscription, if any. */
function activeForCustomer(customerId) {
  return store
    .all(TABLE)
    .find((sub) => sub.customerId === customerId && ACTIVE_STATES.includes(sub.status));
}

/** Subscriptions whose period ends at or before `onIso` — renewal batch. */
function dueForRenewal(onIso) {
  const due = store
    .all(TABLE)
    .filter((sub) => sub.status === "active" && sub.currentPeriodEnd <= onIso);
  return orderBy(due, "currentPeriodEnd", "asc");
}

/** Subscriptions with a failed payment, for the dunning run. */
function pastDue() {
  return filterBy(store.all(TABLE), { status: "past_due" });
}

/** Record one more failed collection attempt. */
function recordDunningAttempt(id, error) {
  const sub = byId(id);
  return update(id, {
    status: "past_due",
    dunningAttempts: (sub.dunningAttempts || 0) + 1,
    lastPaymentError: error,
  });
}

/** Payment succeeded — clear the dunning state. */
function markPaid(id, periodStart, periodEnd) {
  return update(id, {
    status: "active",
    dunningAttempts: 0,
    lastPaymentError: undefined,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });
}

function all() {
  return store.all(TABLE);
}

module.exports = {
  ACTIVE_STATES,
  create,
  byId,
  update,
  activeForCustomer,
  dueForRenewal,
  pastDue,
  recordDunningAttempt,
  markPaid,
  all,
};
