const { getCustomValues, updateCustomValue } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/update-custom-values
 *
 * Actualiza uno o varios custom values existentes en la subcuenta del cliente.
 * NO requiere pasar IDs — resuelve automáticamente el ID de cada custom value
 * buscando por nombre en el catálogo existente de la subcuenta.
 *
 * Flujo:
 *   1. GET /locations/{locationId}/customValues → obtiene catálogo completo
 *   2. Match por `name` (case-insensitive) para resolver el ID de cada valor
 *   3. PUT /locations/{locationId}/customValues/{id} para cada match
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   values (array, required) — Array de custom values a actualizar:
 *     [{ name: "Nombre Existente", value: "nuevo valor" }]
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
    // Paso 1: Obtener todos los custom values existentes en la subcuenta
    const existing = await getCustomValues(companyId, locationId);
    const customValues = existing.customValues || existing || [];

    // Construir mapa de nombre (lowercase) → { id, name }
    const nameMap = {};
    for (const cv of customValues) {
      const key = (cv.name || "").toLowerCase().trim();
      if (key) {
        nameMap[key] = { id: cv.id, name: cv.name };
      }
    }

    // Paso 2: Resolver IDs y actualizar cada valor
    const results = [];
    const errors = [];

    for (const val of values) {
      if (!val.name) {
        errors.push({ name: null, success: false, error: 'Missing "name" in value entry.' });
        continue;
      }

      const lookupKey = val.name.toLowerCase().trim();
      const match = nameMap[lookupKey];

      if (!match) {
        errors.push({
          name: val.name,
          success: false,
          error: `Custom value "${val.name}" not found in location ${locationId}.`,
        });
        continue;
      }

      try {
        const result = await updateCustomValue(companyId, locationId, match.id, {
          name: match.name, // mantener el nombre original
          value: val.value,
        });
        results.push({
          name: match.name,
          id: match.id,
          success: true,
          newValue: val.value,
        });
      } catch (err) {
        errors.push({
          name: val.name,
          id: match.id,
          success: false,
          error: err.message,
        });
      }
    }

    return sendResponse(res, 200, {
      success: errors.length === 0,
      locationId,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Error updating custom values:", err);
    return sendError(res, 500, "Failed to update custom values.", err.message);
  }
};
