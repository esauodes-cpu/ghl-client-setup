const { createUser } = require("../lib/ghl-api");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");
const crypto = require("crypto");

/**
 * Genera una contraseña temporal segura y legible.
 * Formato: 3 palabras + 4 dígitos (ej: Sun-Rock-Wave-4827)
 */
function generateTempPassword() {
  const words = [
    "Sun", "Rock", "Wave", "Fire", "Star", "Moon", "Wind", "Peak",
    "Lake", "Rain", "Gold", "Blue", "Jade", "Oak", "Reef", "Sky",
    "Fox", "Bear", "Hawk", "Wolf", "Pine", "Sage", "Iron", "Bolt",
  ];
  const pick = () => words[crypto.randomInt(words.length)];
  const digits = crypto.randomInt(1000, 9999);
  return `${pick()}-${pick()}-${pick()}-${digits}`;
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

const ROLES = {
  /**
   * Owner: Acceso absoluto a toda la subcuenta.
   * Todos los permisos y todos los scopes disponibles.
   */
  owner: {
    permissions: {
      campaignsEnabled: true,
      campaignsReadOnly: false,
      contactsEnabled: true,
      workflowsEnabled: true,
      workflowsReadOnly: false,
      triggersEnabled: true,
      funnelsEnabled: true,
      websitesEnabled: true,
      opportunitiesEnabled: true,
      dashboardStatsEnabled: true,
      bulkRequestsEnabled: true,
      appointmentsEnabled: true,
      reviewsEnabled: true,
      onlineListingsEnabled: true,
      phoneCallEnabled: true,
      conversationsEnabled: true,
      assignedDataOnly: false,
      adwordsReportingEnabled: true,
      membershipEnabled: true,
      facebookAdsReportingEnabled: true,
      attributionsReportingEnabled: true,
      settingsEnabled: true,
      tagsEnabled: true,
      leadValueEnabled: true,
      marketingEnabled: true,
      agentReportingEnabled: true,
      botService: true,
      socialPlanner: true,
      bloggingEnabled: true,
      invoiceEnabled: true,
      affiliateManagerEnabled: true,
      contentAiEnabled: true,
      refundsEnabled: true,
      recordPaymentEnabled: true,
      cancelSubscriptionEnabled: true,
      paymentsEnabled: true,
      communitiesEnabled: true,
      exportPaymentsEnabled: true,
    },
    scopes: [
      "campaigns.readonly", "campaigns.write", "calendars.readonly", "calendars/events.write",
      "calendars/groups.write", "calendars.write", "contacts.write", "contacts/bulkActions.write",
      "workflows.readonly", "workflows.write", "triggers.write", "funnels.write", "forms.write",
      "surveys.write", "quizzes.write", "websites.write", "medias.write", "medias.readonly",
      "opportunities.write", "opportunities/leadValue.readonly", "opportunities/bulkActions.write",
      "reporting/phone.readonly", "reporting/adwords.readonly", "reporting/facebookAds.readonly",
      "reporting/attributions.readonly", "prospecting/auditReport.write", "reporting/reports.readonly",
      "reporting/agent.readonly", "reporting/reports.write", "reporting/stats.export",
      "payments.write", "payments/records.write", "payments/orders.readonly", "payments/orders.export",
      "payments/orders.import", "payments/orders.collectPayment", "payments/subscriptions.readonly",
      "payments/subscriptions.write", "payments/subscriptions.update", "payments/subscriptions.export",
      "payments/subscriptions.pauseResumeCancel", "payments/subscriptions.sharePaymentMethod",
      "payments/transactions.readonly", "payments/transactions.export", "payments/transactions.import",
      "payments/transactions.refund", "payments/transactions.viewReceipts",
      "payments/taxesSettings.readonly", "payments/settings.readonly",
      "payments/taxesSettings.updateInclusiveExclusive", "payments/taxesSettings.manageRates",
      "payments/taxesSettings.configureAutomatic", "products.readonly", "products.write",
      "products.delete", "products.duplicate", "products.bulkActions",
      "payments/settings.configureReceipt", "payments/settings.configureSubscription",
      "invoices.write", "invoices.readonly", "invoices/schedule.readonly", "invoices/schedule.write",
      "invoices/template.readonly", "invoices/template.write", "reputation/review.write",
      "reputation/listing.write", "reputation/reviewsAIAgents.write", "reputation/gbp.write",
      "conversations.write", "conversations.readonly", "conversations/message.readonly",
      "conversations/message.write", "contentAI.write", "dashboard/stats.readonly",
      "locations/tags.write", "locations/tags.readonly", "marketing.write", "eliza.write",
      "settings.write", "socialplanner/post.write", "socialplanner/account.readonly",
      "socialplanner/account.write", "socialplanner/category.readonly", "socialplanner/category.write",
      "socialplanner/csv.readonly", "socialplanner/csv.write", "socialplanner/group.write",
      "socialplanner/hashtag.readonly", "socialplanner/hashtag.write", "socialplanner/oauth.readonly",
      "socialplanner/oauth.write", "socialplanner/post.readonly", "socialplanner/recurring.readonly",
      "socialplanner/recurring.write", "socialplanner/review.readonly", "socialplanner/review.write",
      "socialplanner/rss.readonly", "socialplanner/rss.write", "socialplanner/search.readonly",
      "socialplanner/setting.readonly", "socialplanner/setting.write", "socialplanner/stat.readonly",
      "socialplanner/tag.readonly", "socialplanner/tag.write", "socialplanner/filters.readonly",
      "socialplanner/medias.readonly", "socialplanner/medias.write",
      "socialplanner/watermarks.readonly", "socialplanner/watermarks.write",
      "socialplanner/metatag.readonly", "socialplanner/facebook.readonly",
      "socialplanner/linkedin.readonly", "socialplanner/twitter.readonly",
      "socialplanner/notification.readonly", "socialplanner/notification.write",
      "socialplanner/snapshot.readonly", "socialplanner/snapshot.write",
      "marketing/affiliate.write", "blogs.write", "membership.write", "communities.write",
      "gokollab.write", "certificates.write", "certificates.readonly", "adPublishing.write",
      "adPublishing.readonly", "prospecting.write", "prospecting.readonly",
      "prospecting/reports.readonly", "private-integration-location.readonly",
      "private-integration-location.write", "private-integration-company.readonly",
      "private-integration-company.write", "native-integrations.readonly",
      "native-integrations.write", "wordpress.write", "wordpress.read", "custom-menu-link.write",
      "qrcodes.write", "users/team-management.write", "users/team-management.readonly",
      "loginas.write", "users-sso-login-management.write", "users-sso-login-management.readonly",
      "sso-config.write", "snapshots/api.readonly", "snapshots/api.create", "snapshots/api.edit",
      "snapshots/api.push", "snapshots/api.refresh", "snapshots/api.share", "snapshots/api.delete",
      "internaltools.location-transfer.write", "internaltools.location-transfer.readonly",
      "affiliateportal.write", "affiliateportal.readonly", "companies.write",
      "internaltools.billing.write", "internaltools.billing.readonly",
      "internaltools.billing-common.readonly", "internaltools.billing-common.write",
      "voice-ai-agents.write", "voice-ai-agents.readonly", "voice-ai-common.readonly",
      "voice-ai-common.write", "voice-ai-agent-goals.readonly", "voice-ai-agent-goals.write",
      "voice-ai-dashboard.readonly", "agency/launchpad.write", "agency/launchpad.readonly",
      "launchpad/location.write", "launchpad/location.readonly", "text-ai-agents.write",
      "text-ai-agent-goals.readonly", "text-ai-agent-goals.write",
      "text-ai-agent-training.write", "text-ai-agents-dashboard.readonly",
    ],
  },

  // Puedes agregar más roles después, por ejemplo:
  // employee: { permissions: { ... }, scopes: [ ... ] },
  // viewer: { permissions: { ... }, scopes: [ ... ] },
};

/**
 * POST /api/create-user
 *
 * Crea un usuario en la subcuenta del cliente con permisos basados en rol.
 * Genera una contraseña temporal que se devuelve en la respuesta.
 *
 * Body:
 *   companyId (string, required) — ID de tu agencia
 *   locationId (string, required) — ID de la subcuenta del cliente
 *   user (object, required):
 *     firstName (string, required)
 *     lastName (string, required)
 *     email (string, required)
 *     phone (string, optional)
 *     role (string, optional) — "owner" (default), "employee", "viewer"
 *     profilePhoto (string, optional)
 *     platformLanguage (string, optional)
 *
 * Response incluye:
 *   tempPassword — Contraseña temporal para compartir con el usuario
 *   loginUrl — URL de login
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

  // Resolver rol → permisos y scopes
  const roleName = user.role || "owner";
  const roleConfig = ROLES[roleName];

  if (!roleConfig) {
    const available = Object.keys(ROLES).join(", ");
    return sendError(res, 400, `Unknown role "${roleName}". Available: ${available}`);
  }

  const tempPassword = generateTempPassword();

  try {
    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: tempPassword,
      type: "account",
      role: "admin",
      permissions: roleConfig.permissions,
      scopes: roleConfig.scopes,
      scopesAssignedToOnly: roleConfig.scopes,
    };

    if (user.phone) userData.phone = user.phone;
    if (user.profilePhoto) userData.profilePhoto = user.profilePhoto;
    if (user.platformLanguage) userData.platformLanguage = user.platformLanguage;

    const result = await createUser(companyId, locationId, userData);

    return sendResponse(res, 200, {
      success: true,
      locationId,
      userId: result.id || result.userId,
      email: user.email,
      role: roleName,
      tempPassword,
      loginUrl: process.env.GHL_LOGIN_URL || "https://app.gohighlevel.com/",
      result,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    return sendError(res, 500, "Failed to create user.", err.message);
  }
};
