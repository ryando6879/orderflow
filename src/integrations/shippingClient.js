const { requestJson } = require("./httpClient");
const { config } = require("../config");

// Carrier aggregator: rate shopping, label purchase, tracking reads.
// Service levels are mapped both ways because the carrier's names are
// not ours.

const SERVICE_MAP = {
  standard: "GROUND",
  express: "2DAY",
  overnight: "NEXT_DAY_AIR",
};

const CARRIER_SERVICE_MAP = Object.fromEntries(
  Object.entries(SERVICE_MAP).map(([ours, theirs]) => [theirs, ours])
);

function headers() {
  return { authorization: `Bearer ${config.shipping.apiKey}` };
}

/** Rate quotes for a parcel, cheapest first. */
async function rateShipment({ toPostalCode, weightGrams, service }) {
  const body = await requestJson({
    method: "POST",
    url: `${config.shipping.baseUrl}/v1/rates`,
    headers: headers(),
    body: {
      to_postal_code: toPostalCode,
      weight_grams: weightGrams,
      service: SERVICE_MAP[service] || SERVICE_MAP.standard,
    },
  });
  return (body.rates || []).sort((a, b) => a.amount - b.amount);
}

/** Buy a label. Returns the tracking number and the label URL. */
async function purchaseLabel({ orderId, toAddress, weightGrams, service }) {
  return requestJson({
    method: "POST",
    url: `${config.shipping.baseUrl}/v1/labels`,
    headers: headers(),
    body: {
      reference: orderId,
      to: toAddress,
      weight_grams: weightGrams,
      service: SERVICE_MAP[service] || SERVICE_MAP.standard,
    },
  });
}

/** Current tracking state for a parcel. */
async function trackParcel(trackingNumber) {
  const body = await requestJson({
    url: `${config.shipping.baseUrl}/v1/tracking/${encodeURIComponent(trackingNumber)}`,
    headers: headers(),
  });
  return {
    trackingNumber,
    carrier: body.carrier,
    service: CARRIER_SERVICE_MAP[body.service] || body.service,
    events: body.events || [],
  };
}

module.exports = { SERVICE_MAP, CARRIER_SERVICE_MAP, rateShipment, purchaseLabel, trackParcel };
