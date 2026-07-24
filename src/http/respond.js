// Response helpers. Every response body is JSON, and every error body has
// the same shape so the storefront can render errors generically:
//
//   { error: { code, message, requestId } }

/** Send a JSON body with a status code. */
function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** 200 with a body. */
function ok(res, body) {
  return json(res, 200, body);
}

/** 201 with a body and a Location header. */
function created(res, body, location) {
  const payload = JSON.stringify(body);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  };
  if (location) headers.location = location;
  res.writeHead(201, headers);
  res.end(payload);
}

/** 204, no body. */
function noContent(res) {
  res.writeHead(204);
  res.end();
}

/** A structured error response. */
function fail(res, status, code, message, requestId) {
  return json(res, status, { error: { code, message, requestId } });
}

/** Send text (used by the CSV export). */
function text(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

/** A paginated list envelope. */
function page(res, result) {
  return ok(res, {
    data: result.rows,
    page: { number: result.page, size: result.limit, total: result.total, pages: result.totalPages, hasNext: result.hasNextPage },
  });
}

module.exports = { json, ok, created, noContent, fail, text, page };
