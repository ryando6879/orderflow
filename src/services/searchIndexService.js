const { getProduct } = require("../catalog");

// The in-process product search index behind the storefront search box.
// It is rebuilt at boot and after a catalog change — small enough that a
// full rebuild is cheaper than incremental updates.

const SKUS = ["TEE-1", "MUG-1", "HAT-1", "STK-1"];
const STOP_WORDS = new Set(["the", "a", "an", "and", "of", "for", "with"]);

/**
 * Split text into index tokens.
 *
 * Contract: tokens are LOWERCASED and stripped of punctuation, so that
 * indexing and querying normalise the same way. Search is
 * case-insensitive: "Mug", "mug" and "MUG" are the same query.
 *
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Build the inverted index: token -> Set of SKUs. */
function buildIndex(skus = SKUS) {
  const index = new Map();
  for (const sku of skus) {
    const product = getProduct(sku);
    for (const token of tokenize(`${sku} ${product.name}`)) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token).add(sku);
    }
  }
  return index;
}

let index = buildIndex();

/** Rebuild after a catalog change. */
function rebuild() {
  index = buildIndex();
  return index.size;
}

/**
 * Search the index.
 *
 * Contract: matching is case-insensitive and prefix-based — a shopper
 * typing "Mug" or "mu" finds the Coffee Mug. Results are the SKUs
 * matching EVERY query token, so extra words narrow the result set.
 *
 * @param {string} query raw text from the search box
 * @returns {string[]} matching SKUs
 */
function search(query) {
  const terms = String(query).toLowerCase().split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (terms.length === 0) return [];

  let matches = null;
  for (const term of terms) {
    const hits = new Set();
    for (const [token, skus] of index.entries()) {
      if (token.startsWith(term)) {
        skus.forEach((sku) => hits.add(sku));
      }
    }
    matches = matches === null ? hits : new Set([...matches].filter((sku) => hits.has(sku)));
  }
  return [...matches].sort();
}

/** Index stats for /admin/search. */
function stats() {
  return { tokens: index.size, skus: SKUS.length };
}

module.exports = { tokenize, buildIndex, rebuild, search, stats, SKUS, STOP_WORDS };

if (require.main === module) {
  console.log('search("mug"):', search("mug"));
  console.log('search("Mug"):', search("Mug"));
}
