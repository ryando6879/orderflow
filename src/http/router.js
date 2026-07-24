// A very small router. OrderFlow does not use a web framework: the API
// surface is a couple of dozen routes and a hand-rolled matcher keeps the
// dependency tree empty (docs/ARCHITECTURE.md#why-no-framework).
//
// Patterns use ":name" for a path parameter: "/v1/orders/:id".

/** Compile a pattern into a matcher. */
function compile(pattern) {
  const segments = pattern.split("/").filter(Boolean);
  return { pattern, segments };
}

/**
 * Match a path against a compiled pattern.
 *
 * @returns {Record<string, string> | null} the path params, or null
 */
function matchPath(compiled, path) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== compiled.segments.length) return null;
  const params = {};
  for (let i = 0; i < parts.length; i += 1) {
    const segment = compiled.segments[i];
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(parts[i]);
    } else if (segment !== parts[i]) {
      return null;
    }
  }
  return params;
}

/** Parse a query string into a flat object. */
function parseQuery(search) {
  const params = new URLSearchParams(search || "");
  return Object.fromEntries(params.entries());
}

class Router {
  constructor() {
    this.routes = [];
  }

  /** Register a handler. `middleware` runs before the handler, in order. */
  add(method, pattern, handler, middleware = []) {
    this.routes.push({ method: method.toUpperCase(), compiled: compile(pattern), handler, middleware });
    return this;
  }

  get(pattern, handler, middleware) {
    return this.add("GET", pattern, handler, middleware);
  }

  post(pattern, handler, middleware) {
    return this.add("POST", pattern, handler, middleware);
  }

  patch(pattern, handler, middleware) {
    return this.add("PATCH", pattern, handler, middleware);
  }

  delete(pattern, handler, middleware) {
    return this.add("DELETE", pattern, handler, middleware);
  }

  /**
   * Find the route for a request.
   *
   * @returns {{route: object, params: Record<string, string>} | null}
   */
  resolve(method, path) {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const params = matchPath(route.compiled, path);
      if (params) return { route, params };
    }
    return null;
  }

  /** Every registered route, for the /v1/routes discovery endpoint. */
  list() {
    return this.routes.map((route) => `${route.method} ${route.compiled.pattern}`);
  }
}

module.exports = { Router, compile, matchPath, parseQuery };
