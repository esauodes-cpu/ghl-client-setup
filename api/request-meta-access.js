const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

// ============================================================
// CONFIGURACIÓN
// ============================================================

const META_API_VERSION = "v21.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Tu Business ID de agencia (Accelerecom).
 * Se toma de env var para no hardcodearlo.
 */
const AGENCY_BUSINESS_ID = process.env.META_BUSINESS_ID;

/**
 * System User Token con permiso business_management.
 * Generado en Business Settings → System Users → Generate Token.
 * No expira mientras el System User esté activo.
 */
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// ============================================================
// DEFINICIÓN DE ACTIVOS Y PERMISOS
// ============================================================

/**
 * Mapa de tipo de activo → configuración del endpoint de Meta.
 *
 * Cada entrada define:
 *   edge: el edge del Graph API bajo /{business-id}/
 *   idParam: nombre del parámetro que Meta espera para el ID del activo
 *   defaultTasks: permisos que solicitamos por defecto
 *   prefixed: si el ID necesita prefijo (ej: "act_" para ad accounts)
 */
const ASSET_CONFIG = {
  ad_account: {
    edge: "client_ad_accounts",
    idParam: "adaccount_id",
    defaultTasks: ["MANAGE", "ADVERTISE", "ANALYZE"],
    prefixed: true, // requiere prefijo "act_"
    prefix: "act_",
  },

  page: {
    edge: "client_pages",
    idParam: "page_id",
    defaultTasks: ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"],
    prefixed: false,
  },

  instagram: {
    edge: "client_instagram_accounts",
    idParam: "instagram_account_id",
    defaultTasks: ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"],
    prefixed: false,
  },

  whatsapp: {
    edge: "client_whatsapp_business_accounts",
    idParam: "whatsapp_business_account_id",
    defaultTasks: ["MANAGE"],
    prefixed: false,
  },
};

// ============================================================
// META API HELPER
// ============================================================

/**
 * Solicita acceso a un activo del cliente via Graph API.
 *
 * POST /{business-id}/{edge}
 *   Body: { [idParam]: "id", permitted_tasks: [...] }
 *   Header: Authorization: Bearer {token}
 */
async function requestAssetAccess(assetType, assetId, customTasks = null) {
  const config = ASSET_CONFIG[assetType];
  if (!config) {
    throw new Error(`Unknown asset type: "${assetType}"`);
  }

  // Formatear ID (agregar prefijo act_ si es necesario)
  let formattedId = String(assetId).trim();
  if (config.prefixed && !formattedId.startsWith(config.prefix)) {
    formattedId = `${config.prefix}${formattedId}`;
  }

  const tasks = customTasks || config.defaultTasks;

  const url = `${META_GRAPH_URL}/${AGENCY_BUSINESS_ID}/${config.edge}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${META_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      [config.idParam]: formattedId,
      permitted_tasks: tasks,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error?.message || JSON.stringify(data);
    const errorCode = data.error?.code || res.status;
    throw new Error(`Meta API error ${errorCode}: ${errorMsg}`);
  }

  return {
    success: true,
    assetType,
    assetId: formattedId,
    permittedTasks: tasks,
    metaResponse: data,
  };
}

/**
 * Verifica que un activo existe y es accesible (GET básico).
 * Útil para validar los IDs antes de solicitar acceso.
 */
async function verifyAsset(assetType, assetId) {
  const config = ASSET_CONFIG[assetType];
  if (!config) return { valid: false, error: "Unknown asset type" };

  let formattedId = String(assetId).trim();
  if (config.prefixed && !formattedId.startsWith(config.prefix)) {
    formattedId = `${config.prefix}${formattedId}`;
  }

  const url = `${META_GRAPH_URL}/${formattedId}?fields=id,name&access_token=${META_ACCESS_TOKEN}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      return { valid: false, id: formattedId, error: data.error?.message || "Not found" };
    }

    return { valid: true, id: data.id, name: data.name };
  } catch (err) {
    return { valid: false, id: formattedId, error: err.message };
  }
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

/**
 * POST /api/request-meta-access
 *
 * Solicita acceso a los activos de Meta del cliente desde tu Business Manager.
 * El cliente recibirá una notificación para aprobar cada solicitud.
 *
 * Body:
 *   contactId (string, optional) — ID del contacto en GHL (para referencia)
 *   contactName (string, optional) — Nombre del cliente
 *   verify (boolean, optional) — Si true, verifica cada ID antes de solicitar (default: true)
 *   assets (object, required):
 *     businessPortfolioId (string, optional) — ID del portafolio de negocios del cliente
 *     adAccountId (string, required) — ID de la cuenta publicitaria
 *     pageId (string, required) — ID de la página de Facebook
 *     instagramId (string, optional) — ID de la cuenta de Instagram
 *     whatsappId (string, optional) — ID de la cuenta de WhatsApp
 *
 * Headers:
 *   Authorization: Bearer {WEBHOOK_SECRET}
 */
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  // Validar configuración del servidor
  if (!AGENCY_BUSINESS_ID) {
    return sendError(res, 500, "Server misconfigured: META_BUSINESS_ID not set.");
  }
  if (!META_ACCESS_TOKEN) {
    return sendError(res, 500, "Server misconfigured: META_ACCESS_TOKEN not set.");
  }

  const { contactId, contactName, assets, verify = true } = req.body || {};

  if (!assets) {
    return sendError(res, 400, 'Missing "assets" object.');
  }

  const { businessPortfolioId, adAccountId, pageId, instagramId, whatsappId } = assets;

  if (!adAccountId && !pageId) {
    return sendError(res, 400, "At least one asset ID is required (adAccountId or pageId).");
  }

  // Construir lista de activos a procesar
  const assetList = [];

  if (adAccountId) {
    assetList.push({ type: "ad_account", id: adAccountId, label: "Ad Account" });
  }
  if (pageId) {
    assetList.push({ type: "page", id: pageId, label: "Facebook Page" });
  }
  if (instagramId) {
    assetList.push({ type: "instagram", id: instagramId, label: "Instagram Account" });
  }
  if (whatsappId) {
    assetList.push({ type: "whatsapp", id: whatsappId, label: "WhatsApp Account" });
  }

  try {
    const results = [];
    const errors = [];

    for (const asset of assetList) {
      // Paso 1: Verificar que el ID es válido (opcional)
      if (verify) {
        const verification = await verifyAsset(asset.type, asset.id);
        if (!verification.valid) {
          errors.push({
            asset: asset.label,
            id: asset.id,
            step: "verification",
            error: verification.error,
          });
          continue; // No intentar solicitar acceso si el ID no es válido
        }
      }

      // Paso 2: Solicitar acceso
      try {
        const result = await requestAssetAccess(asset.type, asset.id);
        results.push({
          asset: asset.label,
          id: result.assetId,
          status: "requested",
          permittedTasks: result.permittedTasks,
        });
      } catch (err) {
        // Detectar si ya tenemos acceso (error común)
        const alreadyHasAccess =
          err.message.includes("already") ||
          err.message.includes("duplicate");

        errors.push({
          asset: asset.label,
          id: asset.id,
          step: "access_request",
          error: err.message,
          note: alreadyHasAccess
            ? "You may already have access to this asset."
            : undefined,
        });
      }
    }

    return sendResponse(res, 200, {
      success: errors.length === 0,
      contactId: contactId || null,
      contactName: contactName || null,
      businessPortfolioId: businessPortfolioId || null,
      agencyBusinessId: AGENCY_BUSINESS_ID,
      requested: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      note: results.length > 0
        ? "Access requests sent. The client must approve them in their Business Manager → Settings → Requests."
        : undefined,
    });
  } catch (err) {
    console.error("Error requesting Meta access:", err);
    return sendError(res, 500, "Failed to request Meta access.", err.message);
  }
};
