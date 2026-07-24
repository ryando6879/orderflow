const crypto = require("node:crypto");

// Inbound webhook authentication. The payments provider signs every
// delivery with a shared secret and sends the signature in a header:
//
//   OF-Signature: t=1784337712,v1=9f2a…
//
// We recompute the signature over `${timestamp}.${rawBody}` and compare.

const SIGNATURE_HEADER = "of-signature";
const TOLERANCE_SECONDS = 300;

/**
 * Split the signature header into its parts.
 *
 * Contract: returns `{timestamp, signature}` for a well-formed header.
 * The header is attacker-controlled, so anything unexpected — missing
 * header, missing `t=`/`v1=` element, no `=` in an element at all — is a
 * REJECTED delivery (return null), never a crash: an unauthenticated
 * caller must not be able to take the endpoint down.
 *
 * @param {string | undefined} header raw header value
 * @returns {{timestamp: string, signature: string} | null}
 */
function parseSignatureHeader(header) {
  const parts = {};
  for (const element of header.split(",")) {
    const [key, value] = element.split("=");
    parts[key.trim()] = value.trim();
  }
  if (!parts.t || !parts.v1) return null;
  return { timestamp: parts.t, signature: parts.v1 };
}

/** The expected signature for a body/timestamp pair. */
function expectedSignature(rawBody, timestamp, secret) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/** Constant-time compare of two hex digests. */
function digestsMatch(left, right) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Verify an inbound webhook.
 *
 * @param {{rawBody: string, header: string | undefined, secret: string,
 *          nowSeconds?: number}} input
 * @returns {{valid: boolean, reason?: string}}
 */
function verifyWebhook({ rawBody, header, secret, nowSeconds }) {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return { valid: false, reason: "malformed_signature_header" };

  const now = nowSeconds ?? Math.floor(Date.now() / 1000);
  const age = now - Number.parseInt(parsed.timestamp, 10);
  if (!Number.isFinite(age) || Math.abs(age) > TOLERANCE_SECONDS) {
    return { valid: false, reason: "timestamp_out_of_tolerance" };
  }

  const expected = expectedSignature(rawBody, parsed.timestamp, secret);
  if (!digestsMatch(expected, parsed.signature)) {
    return { valid: false, reason: "signature_mismatch" };
  }
  return { valid: true };
}

module.exports = {
  SIGNATURE_HEADER,
  TOLERANCE_SECONDS,
  parseSignatureHeader,
  expectedSignature,
  digestsMatch,
  verifyWebhook,
};

if (require.main === module) {
  // What a scanner hitting the webhook endpoint sends: a header with no
  // key=value structure at all.
  console.log("scanner delivery:", verifyWebhook({ rawBody: "{}", header: "garbage", secret: "whsec_test" }));
}
