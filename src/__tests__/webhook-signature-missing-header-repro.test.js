const { describe, it, expect } = require('@jest/globals');
const { verifyWebhook, SIGNATURE_HEADER } = require('../integrations/webhookSignature');

describe('verifyWebhook with missing or malformed signature header', () => {
  const validSecret = 'whsec_test_secret_key';
  const rawBody = '{"id":"evt_123","type":"charge.succeeded","data":{"orderId":"ORD-7K4M2Q"}}';
  const nowSeconds = 1784337712;

  it('returns {valid: false, reason: "malformed_signature_header"} when header is undefined (missing)', () => {
    const result = verifyWebhook({
      rawBody,
      header: undefined,
      secret: validSecret,
      nowSeconds
    });
    
    expect(result).toEqual({
      valid: false,
      reason: 'malformed_signature_header'
    });
  });

  it('returns {valid: false, reason: "malformed_signature_header"} when header is null', () => {
    const result = verifyWebhook({
      rawBody,
      header: null,
      secret: validSecret,
      nowSeconds
    });
    
    expect(result).toEqual({
      valid: false,
      reason: 'malformed_signature_header'
    });
  });

  it('returns {valid: false, reason: "malformed_signature_header"} when header is junk with no structure', () => {
    const result = verifyWebhook({
      rawBody,
      header: 'complete-garbage-no-equals-signs',
      secret: validSecret,
      nowSeconds
    });
    
    expect(result).toEqual({
      valid: false,
      reason: 'malformed_signature_header'
    });
  });

  it('returns {valid: false, reason: "malformed_signature_header"} when header has structure but missing required parts', () => {
    const result = verifyWebhook({
      rawBody,
      header: 'foo=bar,baz=qux',
      secret: validSecret,
      nowSeconds
    });
    
    expect(result).toEqual({
      valid: false,
      reason: 'malformed_signature_header'
    });
  });

  it('returns {valid: false, reason: "signature_mismatch"} when header is well-formed but signature is wrong', () => {
    const result = verifyWebhook({
      rawBody,
      header: 't=1784337712,v1=wrongsignaturehex',
      secret: validSecret,
      nowSeconds
    });
    
    expect(result).toEqual({
      valid: false,
      reason: 'signature_mismatch'
    });
  });
});
