const { createCustomValue } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/create-custom-values
 *
 * Crea uno o varios custom values en la subcuenta del cliente.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   values (array, required) — Array de custom values:
 *     [{ name, value }]
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, values } = req.body || {};

  if (!companyId) return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!values || !Array.isArray(values) || values.length === 0) {
    return sendError(res, 400, 'Missing or empty "values" array.');
  }

  try {
    const results = [];
    const errors = [];

    for (const val of values) {
      try {
        const result = await createCustomValue(companyId, locationId, val);
        results.push({ name: val.name, success: true, id: result.id });
      } catch (err) {
        errors.push({ name: val.name, success: false, error: err.message });
      }
    }

    return sendResponse(res, 200, {
      success: errors.length === 0,
      locationId,
      created: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error creating custom values:", err);
    return sendError(res, 500, "Failed to create custom values.", err.message);
  }
};
