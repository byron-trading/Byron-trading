import crypto from "crypto";

export default async function handler(req, res) {
  const clientId = process.env.DERIV_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: "DERIV_CLIENT_ID is not configured."
    });
  }

  const redirectUri =
    "https://byron-trading.vercel.app/api/oauth/callback";

  const codeVerifier = crypto.randomBytes(48).toString("base64url");
  const state = crypto.randomBytes(32).toString("hex");

  const challenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const authUrl = new URL(
    "https://auth.deriv.com/oauth2/auth"
  );

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "trade");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  res.setHeader("Set-Cookie", [
    `oauth_state=${encodeURIComponent(state)}; Max-Age=600; Path=/; Secure; HttpOnly; SameSite=Lax`,
    `pkce_code_verifier=${encodeURIComponent(codeVerifier)}; Max-Age=600; Path=/; Secure; HttpOnly; SameSite=Lax`
  ]);

  return res.redirect(302, authUrl.toString());
}
