export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({
      error: "No authorization code received from Deriv."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Deriv authorization code received.",
    code_received: true,
    state_received: Boolean(state)
  });
}
