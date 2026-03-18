const { createBusiness } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/create-business
 *
 * Crea un registro de negocio (Business) en la subcuenta del cliente
 * con los datos de facturación.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   business (object, required) — Datos del negocio:
 *     name (string, required) — Nombre del negocio
 *     phone (string, optional) — Teléfono
 *     email (string, optional) — Email de facturación
 *     website (string, optional) — Web
 *     address (string, optional) — Dirección
 *     city (string, optional) — Ciudad
 *     state (string, optional) — Estado
 *     country (string, optional) — País
 *     postalCode (string, optional) — CP
 *     description (string, optional) — Descripción
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, business } = req.body || {};

  if (!companyId) return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!business || !business.name) {
    return sendError(res, 400, 'Missing business data. Required: name.');
  }

  try {
    const result = await createBusiness(companyId, locationId, business);

    return sendResponse(res, 200, {
      success: true,
      locationId,
      businessId: result.id || result.businessId,
      result,
    });
  } catch (err) {
    console.error("Error creating business:", err);
    return sendError(res, 500, "Failed to create business.", err.message);
  }
};
