// Decides whether a coupon can still be redeemed.

/**
 * Whether a coupon is still redeemable at time `nowISO`.
 *
 * Contract: a coupon is valid THROUGH the whole of its `expiresOn` day. A
 * customer who is told "valid through Mar 31" can redeem it any time on
 * March 31 itself. Validity is a date-only comparison: the coupon is good
 * as long as today's date is ON OR BEFORE `expiresOn` (the expiry day is
 * inclusive).
 *
 * @param {{ code: string, expiresOn: string }} coupon expiresOn = YYYY-MM-DD
 * @param {string} nowISO current time (ISO)
 * @returns {boolean}
 */
function isCouponValid(coupon, nowISO) {
  const today = nowISO.slice(0, 10);
  return today < coupon.expiresOn;
}

module.exports = { isCouponValid };

if (require.main === module) {
  // A customer opens her cart on the last valid day of a "valid through
  // March 31" coupon and tries to apply it.
  const coupon = { code: "SPRING20", expiresOn: "2026-03-31" };
  const now = "2026-03-31T10:00:00Z";
  console.log(
    `Coupon ${coupon.code} on ${now.slice(0, 10)}:`,
    isCouponValid(coupon, now) ? "valid" : "expired"
  );
}
