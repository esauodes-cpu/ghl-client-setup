const { createUser } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**
 * POST /api/create-user
 *
 * Crea un usuario en la subcuenta del cliente.
 * Llamado desde un Custom Webhook en GHL.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   user (object, required) — Datos del usuario:
 *     firstName (string, required) — Nombre
 *     lastName (string, required) — Apellido
 *     email (string, required) — Email
 *     phone (string, optional) — Teléfono
 *     type (string, optional) — "admin" (default) o "user"
 *     role (string, optional) — Rol del usuario
 *     permissions (object, optional) — Permisos específicos
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  const { companyId, locationId, user } = req.body || {};

  if (!companyId) return sendError(res, 400, 'Missing "companyId".');
  if (!locationId) return sendError(res, 400, 'Missing "locationId".');
  if (!user || !user.firstName || !user.lastName || !user.email) {
    return sendError(res, 400, 'Missing user data. Required: firstName, lastName, email.');
  }

  try {
    const result = await createUser(companyId, locationId, user);

    return sendResponse(res, 200, {
      success: true,
      locationId,
      userId: result.id || result.userId,
      email: user.email,
      result,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return sendError(res, 500, "Failed to create user.", err.message);
  }
};
