const { ghlRequest } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/update-calendar
 *
 * Actualiza el meeting URL de un calendario en GHL.
 *
 * Body:
 *   companyId  (string, required) — ID de la agencia
 *   locationId (string, required) — ID de la subcuenta
 *   calendarId (string, required) — ID del calendario a actualizar
 *   meetingUrl (string, required) — URL de la reunión
 *
 * Respuesta: { success: true, event: { ... } }
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, calendarId, meetingUrl } = req.body || {};

  if (!companyId)  return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!calendarId) return sendError(res, 400, 'Missing "calendarId".');
  if (!meetingUrl) return sendError(res, 400, 'Missing "meetingUrl".');

  try {
    const event = await ghlRequest(
      companyId,
      locationId,
      "PUT",
      `/calendars/${calendarId}`,
      {
        locationConfigurations: [{ kind: "custom", location: meetingUrl }],
      }
    );

    return sendResponse(res, 200, { success: true, event });
  } catch (err) {
    console.error("Error updating calendar:", err);
    return sendError(res, 500, "Failed to update calendar.", err.message);
  }
};
