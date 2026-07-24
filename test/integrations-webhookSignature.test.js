import { describe, it, expect } from "vitest";
import { expectedSignature, digestsMatch, verifyWebhook } from "../src/integrations/webhookSignature.js";

const SECRET = "whsec_test_local";
const TIMESTAMP = "1784337712";
const BODY = '{"id":"evt_1","type":"charge.succeeded"}';

function signedHeader(body = BODY, timestamp = TIMESTAMP) {
  return `t=${timestamp},v1=${expectedSignature(body, timestamp, SECRET)}`;
}

describe("digests", () => {
  it("matches a digest with itself", () => {
    const digest = expectedSignature(BODY, TIMESTAMP, SECRET);
    expect(digestsMatch(digest, digest)).toBe(true);
  });

  it("does not match a different digest", () => {
    const a = expectedSignature(BODY, TIMESTAMP, SECRET);
    const b = expectedSignature(BODY, TIMESTAMP, "other_secret");
    expect(digestsMatch(a, b)).toBe(false);
  });
});

describe("verifyWebhook", () => {
  it("accepts a correctly signed delivery", () => {
    const verdict = verifyWebhook({
      rawBody: BODY,
      header: signedHeader(),
      secret: SECRET,
      nowSeconds: Number(TIMESTAMP) + 10,
    });
    expect(verdict.valid).toBe(true);
  });

  it("rejects a tampered body", () => {
    const verdict = verifyWebhook({
      rawBody: '{"id":"evt_1","type":"charge.refunded"}',
      header: signedHeader(),
      secret: SECRET,
      nowSeconds: Number(TIMESTAMP) + 10,
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toBe("signature_mismatch");
  });

  it("rejects a delivery signed with the wrong secret", () => {
    const verdict = verifyWebhook({
      rawBody: BODY,
      header: `t=${TIMESTAMP},v1=${expectedSignature(BODY, TIMESTAMP, "wrong")}`,
      secret: SECRET,
      nowSeconds: Number(TIMESTAMP) + 10,
    });
    expect(verdict.reason).toBe("signature_mismatch");
  });

  it("rejects a replay from outside the tolerance window", () => {
    const verdict = verifyWebhook({
      rawBody: BODY,
      header: signedHeader(),
      secret: SECRET,
      nowSeconds: Number(TIMESTAMP) + 4000,
    });
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toBe("timestamp_out_of_tolerance");
  });
});
