// Landing page for the storefront: renders the hero + sign-in form and
// handles the sign-in submit.

const { ROUTES } = require("./routes");
const { signIn } = require("./auth");

/** Render the landing page. Pass { error } to show a banner above the form. */
function renderLandingPage(options = {}) {
  const banner = options.error ? `  <p class="error">${options.error}</p>` : null;
  return [
    '<main class="landing">',
    "  <h1>Orderflow</h1>",
    "  <p>Everything for your morning order, in one place.</p>",
    banner,
    '  <form id="sign-in" method="post" action="/session">',
    '    <input name="email" type="email" placeholder="Email" />',
    '    <input name="password" type="password" placeholder="Password" />',
    '    <button type="submit">Sign in</button>',
    "  </form>",
    "</main>",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Handle the landing-page sign-in submit. Always answers the customer: on
 * success they are redirected home with their session; on bad credentials the
 * landing page is re-rendered with an error banner.
 */
async function handleSignIn(email, password) {
  try {
    const session = await signIn(email, password);
    return { redirectTo: ROUTES.home, session };
  } catch (err) {
    return { error: err.message, page: renderLandingPage({ error: "Invalid email or password." }) };
  }
}

module.exports = { renderLandingPage, handleSignIn };

if (require.main === module) {
  (async () => {
    console.log("submitting the sign-in form with a wrong password...");
    const result = await handleSignIn("ryan@example.com", "wrong-password");
    console.log("sign-in answered:", JSON.stringify(result.error || result.redirectTo));
  })();
}
