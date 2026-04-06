const { ghlRequest } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/update-calendar
 *
 * Actualiza la fecha/hora y el meeting URL de un appointment en el calendario de GHL.
 *
 * Body:
 *   companyId  (string, required) — ID de la agencia
 *   locationId (string, required) — ID de la subcuenta
 *   eventId    (string, required) — ID del appointment a actualizar
 *   startTime  (string, required) — Nueva fecha/hora de inicio (ISO 8601)
 *   meetingUrl (string, required) — URL de la reunión (se guarda en el campo address)
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

  const { companyId, locationId, eventId, startTime, meetingUrl } = req.body || {};

  if (!companyId)  return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!eventId)    return sendError(res, 400, 'Missing "eventId".');
  if (!startTime)  return sendError(res, 400, 'Missing "startTime".');
  if (!meetingUrl) return sendError(res, 400, 'Missing "meetingUrl".');

  try {
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return sendError(res, 400, 'Invalid "startTime": must be a valid ISO 8601 date.');
    }

    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // startTime + 2 horas

    const event = await ghlRequest(
      companyId,
      locationId,
      "PUT",
      `/calendars/events/appointments/${eventId}`,
      {
        startTime: start.toISOString(),
        endTime:   end.toISOString(),
        address:   meetingUrl,
      }
    );

    return sendResponse(res, 200, { success: true, event });
  } catch (err) {
    console.error("Error updating calendar event:", err);
    return sendError(res, 500, "Failed to update calendar event.", err.message);
  }
};
