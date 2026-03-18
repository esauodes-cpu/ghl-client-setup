const { updateBusinessProfile } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/setup-business-profile
 *
 * Configura el Business Profile de la subcuenta de un cliente.
 * Llamado desde un Custom Webhook en GHL.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   profile (object, required) — Datos del Business Profile:
 *     name (string) — Nombre comercial
 *     phone (string) — Teléfono del negocio
 *     email (string) — Email del negocio
 *     website (string) — Web principal
 *     address (string) — Dirección
 *     city (string) — Ciudad
 *     state (string) — Estado
 *     country (string) — País (código ISO: US, MX, ES, etc.)
 *     postalCode (string) — Código postal
 *     timezone (string) — Zona horaria (ej: America/Mexico_City)
 *     logoUrl (string) — URL del logo
 *     business (object) — { legalName, businessType, industry }
 *     social (object) — { facebookUrl, instagram, linkedIn, twitter, youtube, googleBusinessProfile }
 *     settings (object) — { allowDuplicateContact, allowDuplicateOpportunity, allowFacebookNameMerge }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, profile } = req.body || {};

  if (!companyId) {
    return sendError(res, 400, 'Missing "companyId".');
  }
  if (!locationId) {
    return sendError(res, 400, 'Missing "locationId".');
  }
  if (!profile || typeof profile !== "object") {
    return sendError(res, 400, 'Missing or invalid "profile" object.');
  }

  try {
    const result = await updateBusinessProfile(companyId, locationId, profile);

    return sendResponse(res, 200, {
      success: true,
      locationId,
      updated: Object.keys(profile),
      result,
    });
  } catch (err) {
    console.error("Error updating business profile:", err);
    return sendError(res, 500, "Failed to update business profile.", err.message);
  }
};
