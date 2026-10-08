export default async function handler(req, res) {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      error,
      message: error_description || "Deriv authorization was cancelled."
    });
  }

  if (!code || !state) {
    return res.status(400).json({
      success: false,
      message: "Missing authorization code or state."
    });
  }

  const cookies = req.headers.cookie || "";

  const getCookie = (name) => {
    const match = cookies.match(
      new RegExp("(^|; )" + name + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  };

  const savedState = getCookie("oauth_state");
  const codeVerifier = getCookie("pkce_code_verifier");

  if (!savedState || state !== savedState) {
    return res.status(400).json({
      success: false,
      message: "Invalid OAuth state."
    });
  }

  if (!codeVerifier) {
    return res.status(400).json({
      success: false,
      message: "PKCE verifier is missing."
    });
  }

  const clientId = process.env.DERIV_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: "DERIV_CLIENT_ID is not configured."
    });
  }

  const tokenResponse = await fetch(
    "https://auth.deriv.com/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri:
          "https://byron-trading.vercel.app/api/oauth/callback"
      })
    }
  );

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData.access_token) {
    return res.status(400).json({
      success: false,
      message: "Deriv token exchange failed.",
      details: tokenData
    });
  }

  res.setHeader("Set-Cookie", [
    "oauth_state=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax",
    "pkce_code_verifier=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax"
  ]);

  return res.status(200).json({
    success: true,
    message: "BYRON TRADING connected to Deriv successfully.",
    connected: true,
    expires_in: tokenData.expires_in
  });
}
