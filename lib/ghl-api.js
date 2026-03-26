const { GHL_BASE_URL, getLocationToken } = require("./token-manager");

const API_VERSION = "2021-07-28";

/**
 * Hace una request autenticada a la API de GHL a nivel de subcuenta.
 * Obtiene el location token automáticamente.
 */
async function ghlRequest(companyId, locationId, method, path, body = null) {
  const token = await getLocationToken(companyId, locationId);

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: API_VERSION,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${GHL_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `GHL API ${method} ${path} failed: ${res.status} — ${JSON.stringify(data)}`
    );
  }

  return data;
}

/**
 * Actualiza el Business Profile de una subcuenta.
 * PUT /locations/{locationId}
 */
async function updateBusinessProfile(companyId, locationId, profileData) {
  return ghlRequest(companyId, locationId, "PUT", `/locations/${locationId}`, profileData);
}

/**
 * Obtiene el Business Profile actual de una subcuenta.
 * GET /locations/{locationId}
 */
async function getBusinessProfile(companyId, locationId) {
  return ghlRequest(companyId, locationId, "GET", `/locations/${locationId}`);
}

/**
 * Crea un usuario en la subcuenta del cliente.
 * POST /users/
 */
async function createUser(companyId, locationId, userData) {
  return ghlRequest(companyId, locationId, "POST", "/users/", {
    ...userData,
    locationIds: [locationId],
    companyId,
  });
}

/**
 * Crea un negocio (Business) en la subcuenta del cliente.
 * POST /businesses/
 */
async function createBusiness(companyId, locationId, businessData) {
  return ghlRequest(companyId, locationId, "POST", "/businesses/", {
    ...businessData,
    locationId,
  });
}

/**
 * Crea un custom field en la subcuenta.
 * POST /locations/{locationId}/customFields
 */
async function createCustomField(companyId, locationId, fieldData) {
  return ghlRequest(
    companyId,
    locationId,
    "POST",
    `/locations/${locationId}/customFields`,
    fieldData
  );
}

/**
 * Crea un custom value en la subcuenta.
 * POST /locations/{locationId}/customValues
 */
async function createCustomValue(companyId, locationId, valueData) {
  return ghlRequest(
    companyId,
    locationId,
    "POST",
    `/locations/${locationId}/customValues`,
    valueData
  );
}

/**
 * Obtiene todos los custom values de una subcuenta.
 * GET /locations/{locationId}/customValues
 */
async function getCustomValues(companyId, locationId) {
  return ghlRequest(
    companyId,
    locationId,
    "GET",
    `/locations/${locationId}/customValues`
  );
}

/**
 * Actualiza un custom value existente en la subcuenta.
 * PUT /locations/{locationId}/customValues/{customValueId}
 */
async function updateCustomValue(companyId, locationId, customValueId, valueData) {
  return ghlRequest(
    companyId,
    locationId,
    "PUT",
    `/locations/${locationId}/customValues/${customValueId}`,
    valueData
  );
}

/**
 * Sube un archivo media a la subcuenta.
 * Nota: Este endpoint requiere multipart/form-data,
 * se implementará si se necesita subir logos directamente.
 */

module.exports = {
  ghlRequest,
  updateBusinessProfile,
  getBusinessProfile,
  createUser,
  createBusiness,
  createCustomField,
  createCustomValue,
  getCustomValues,
  updateCustomValue,
};
