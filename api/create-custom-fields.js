const { createCustomField } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/create-custom-fields
 *
 * Crea uno o varios custom fields en la subcuenta del cliente.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   fields (array, required) — Array de custom fields a crear:
 *     [{ name, fieldKey, dataType, placeholder? }]
 *
 *   dataType options: TEXT, NUMBER, LARGE_TEXT, PHONE, EMAIL,
 *     MONETARY, CHECKBOX, SINGLE_OPTIONS, MULTIPLE_OPTIONS,
 *     DATE, FILE_UPLOAD, SIGNATURE
 *
 *   Para SINGLE_OPTIONS / MULTIPLE_OPTIONS, incluir:
 *     options: [{ value: "opción1" }, { value: "opción2" }]
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, fields } = req.body || {};

  if (!companyId) return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return sendError(res, 400, 'Missing or empty "fields" array.');
  }

  try {
    const results = [];
    const errors = [];

    for (const field of fields) {
      try {
        const result = await createCustomField(companyId, locationId, field);
        results.push({ name: field.name, success: true, id: result.id });
      } catch (err) {
        errors.push({ name: field.name, success: false, error: err.message });
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
    console.error("Error creating custom fields:", err);
    return sendError(res, 500, "Failed to create custom fields.", err.message);
  }
};
