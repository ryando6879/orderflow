// Customer sign-in for the storefront. Sessions issued here are attached to
// the order flow so a customer's cart follows them across devices.

const crypto = require("crypto");

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Demo accounts. Passwords are stored as sha256 digests, never plaintext.
const USERS = [
  { email: "ryan@example.com", name: "Ryan", passwordHash: sha256("orderflow-demo") },
  { email: "dana@example.com", name: "Dana", passwordHash: sha256("hunter-orange-2") },
];

/** Look up a registered customer by email (case-insensitive). */
function findUser(email) {
  const needle = String(email || "").trim().toLowerCase();
  return USERS.find((u) => u.email === needle) || null;
}

/** Check a candidate password against the stored digest. */
function verifyPassword(user, password) {
  return user.passwordHash === sha256(String(password ?? ""));
}

function createSession(user) {
  return {
    sessionId: `SES-${crypto.randomBytes(6).toString("hex")}`,
    email: user.email,
    name: user.name,
  };
}

/**
 * Sign a customer in with email + password.
 *
 * Contract: the returned promise always settles — it resolves with a session
 * ({ sessionId, email, name }) on success and rejects with an
 * "invalid credentials" Error otherwise, so callers can surface the failure
 * to the customer.
 */
function signIn(email, password) {
  return new Promise((resolve, reject) => {
    const user = findUser(email);
    if (!user || !verifyPassword(user, password)) {
      return reject(new Error("Invalid email or password."));
    }
    resolve(createSession(user));
  });
}

module.exports = { findUser, verifyPassword, signIn };
