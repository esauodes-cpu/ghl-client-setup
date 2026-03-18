const { getAgencyTokens, getLocationToken } = require("../lib/token-manager");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/debug-token
 *
 * Endpoint de diagnóstico para verificar el estado de los tokens.
 * Muestra: token de agencia, si está expirado, y si puede generar
 * un location token para una subcuenta específica.
 *
 * Body:
 *   companyId (string, required)
 *   locationId (string, optional) — si se incluye, intenta el token exchange
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId } = req.body || {};

  if (!companyId) return sendError(res, 400, 'Missing "companyId".');

  const debug = { companyId, steps: [] };

  try {
    // Paso 1: Obtener token de agencia
    const agency = await getAgencyTokens(companyId);
    debug.steps.push({
      step: "agency_token",
      status: "ok",
      tokenPreview: agency.access_token.substring(0, 20) + "...",
    });

    // Paso 2: Si se pasó locationId, intentar el token exchange
    if (locationId) {
      try {
        const locationToken = await getLocationToken(companyId, locationId);
        debug.steps.push({
          step: "location_token_exchange",
          status: "ok",
          locationId,
          tokenPreview: locationToken.substring(0, 20) + "...",
        });

        // Paso 3: Intentar un GET a la location para verificar permisos
        try {
          const testRes = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId}`,
            {
              headers: {
                Authorization: `Bearer ${locationToken}`,
                Version: "2021-07-28",
                Accept: "application/json",
              },
            }
          );
          const testData = await testRes.json();
          debug.steps.push({
            step: "location_read_test",
            status: testRes.ok ? "ok" : "failed",
            httpStatus: testRes.status,
            locationName: testData.location?.name || testData.name || null,
            error: testRes.ok ? null : testData,
          });
        } catch (readErr) {
          debug.steps.push({
            step: "location_read_test",
            status: "error",
            error: readErr.message,
          });
        }
      } catch (exchangeErr) {
        debug.steps.push({
          step: "location_token_exchange",
          status: "failed",
          locationId,
          error: exchangeErr.message,
        });
      }
    }

    return sendResponse(res, 200, { success: true, debug });
  } catch (err) {
    debug.steps.push({ step: "agency_token", status: "failed", error: err.message });
    return sendResponse(res, 200, { success: false, debug });
  }
};
