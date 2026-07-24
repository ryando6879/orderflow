import { describe, it, expect, afterEach } from "vitest";
import { HttpError, isRetryable, requestJson, setTransport } from "../src/integrations/httpClient.js";

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

let restore;

afterEach(() => {
  if (restore) setTransport(restore);
  restore = undefined;
});

describe("retry classification", () => {
  it("retries a provider 500", () => {
    expect(isRetryable(new HttpError(500, null, "https://x.test"))).toBe(true);
  });

  it("retries a rate limit", () => {
    expect(isRetryable(new HttpError(429, null, "https://x.test"))).toBe(true);
  });

  it("retries a network error", () => {
    expect(isRetryable(new Error("ECONNRESET"))).toBe(true);
  });
});

describe("requestJson", () => {
  it("returns the decoded body", async () => {
    restore = setTransport(async () => response(200, { id: "ch_1" }));
    await expect(requestJson({ url: "https://payments.test/v1/charges" })).resolves.toEqual({ id: "ch_1" });
  });

  it("returns null for an empty body", async () => {
    restore = setTransport(async () => response(204));
    await expect(requestJson({ url: "https://payments.test/v1/ping" })).resolves.toBeNull();
  });

  it("sends the method and the JSON body", async () => {
    let seen;
    restore = setTransport(async (url, init) => {
      seen = { url, init };
      return response(200, { ok: true });
    });
    await requestJson({ method: "POST", url: "https://payments.test/v1/charges", body: { amount: 100 } });
    expect(seen.init.method).toBe("POST");
    expect(JSON.parse(seen.init.body)).toEqual({ amount: 100 });
    expect(seen.init.headers["content-type"]).toBe("application/json");
  });

  it("throws an HttpError carrying the status", async () => {
    restore = setTransport(async () => response(500, { message: "boom" }));
    await expect(
      requestJson({ url: "https://payments.test/v1/charges", attempts: 1 })
    ).rejects.toMatchObject({ name: "HttpError", status: 500 });
  });
});
