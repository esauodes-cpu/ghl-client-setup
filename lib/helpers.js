/**
 * Valida el Bearer Token del webhook.
 */
function validateWebhookSecret(req) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return true;

  const authHeader = req.headers["authorization"] || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  return bearerToken === expected;
}

function sendResponse(res, status, data) {
  return res.status(status).json(data);
}

function sendError(res, status, message, details = null) {
  const body = { success: false, error: message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = { validateWebhookSecret, sendResponse, sendError };
