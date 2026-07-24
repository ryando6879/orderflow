// The order state machine. Every write that moves an order asks this
// module first, so this table is the one place the lifecycle is defined.
//
// The lifecycle, as agreed with ops:
//
//   pending    -> paid | cancelled
//   paid       -> fulfilled | cancelled | partially_refunded | refunded
//   fulfilled  -> partially_refunded | refunded | closed
//   partially_refunded -> refunded | closed
//   refunded   -> closed
//   cancelled  -> (terminal)
//   closed     -> (terminal)
//
// A partial refund is a first-class stop on the way: support refunds one
// line of a multi-line order all the time, both before and after the
// order ships, and the order stays serviceable afterwards.

const TRANSITIONS = {
  pending: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled", "refunded"],
  fulfilled: ["partially_refunded", "refunded", "closed"],
  partially_refunded: ["refunded", "closed"],
  refunded: ["closed"],
  cancelled: [],
  closed: [],
};

const ALL_STATES = Object.keys(TRANSITIONS);

/** States an order can never leave. */
function isTerminal(state) {
  return (TRANSITIONS[state] || []).length === 0;
}

/**
 * Whether an order may move from `from` to `to`.
 *
 * @param {string} from current state
 * @param {string} to requested state
 * @returns {boolean}
 */
function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Move an order, or throw with a message support can act on.
 *
 * @param {{id: string, status: string}} order
 * @param {string} to requested state
 * @returns {{id: string, status: string}} the order, moved
 */
function transition(order, to) {
  if (!canTransition(order.status, to)) {
    const err = new Error(`order ${order.id} cannot move from ${order.status} to ${to}`);
    err.code = "invalid_transition";
    err.statusCode = 409;
    throw err;
  }
  return { ...order, status: to };
}

module.exports = { TRANSITIONS, ALL_STATES, isTerminal, canTransition, transition };
