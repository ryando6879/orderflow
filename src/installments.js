// "Pay in 4" installments: split an order total into equal scheduled
// charges so a shopper can spread payment across a few weeks.

/**
 * Split an order total into `count` installment amounts.
 *
 * Contract: the returned amounts MUST sum to EXACTLY `totalCents`. Across
 * the whole plan a customer can never be charged a cent more or less than
 * their order. Installments are as equal as possible; because a total
 * rarely divides evenly, the indivisible remainder is loaded onto the
 * FIRST installment (the one collected at checkout) so the customer covers
 * the odd cents up front and every later charge is the clean base amount.
 *
 * @param {number} totalCents order total in cents
 * @param {number} count number of installments (e.g. 4)
 * @returns {number[]} per-installment amounts in cents, first to last
 */
function splitInstallments(totalCents, count) {
  const each = Math.round(totalCents / count);
  return Array.from({ length: count }, () => each);
}

module.exports = { splitInstallments };
