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

  /**
   * Admin: Operación completa sin acceso a configuración de plataforma.
   * Todo lo del Owner excepto settings, SSO, billing interno e integraciones.
   */
  admin: {
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
      settingsEnabled: false,
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
      "socialplanner/post.write", "socialplanner/account.readonly",
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
      "prospecting/reports.readonly",
      "users/team-management.write", "users/team-management.readonly",
      "voice-ai-agents.write", "voice-ai-agents.readonly", "voice-ai-common.readonly",
      "voice-ai-common.write", "voice-ai-agent-goals.readonly", "voice-ai-agent-goals.write",
      "voice-ai-dashboard.readonly",
      "text-ai-agents.write", "text-ai-agent-goals.readonly", "text-ai-agent-goals.write",
      "text-ai-agent-training.write", "text-ai-agents-dashboard.readonly",
    ],
  },

  /**
   * Setter: Enfocado en agendar citas y gestionar conversaciones.
   * Ve solo contactos/oportunidades asignados. Sin acceso a pagos,
   * marketing, reportes ni configuración.
   */
  setter: {
    permissions: {
      campaignsEnabled: false,
      campaignsReadOnly: false,
      contactsEnabled: true,
      workflowsEnabled: false,
      workflowsReadOnly: false,
      triggersEnabled: false,
      funnelsEnabled: false,
      websitesEnabled: false,
      opportunitiesEnabled: true,
      dashboardStatsEnabled: false,
      bulkRequestsEnabled: false,
      appointmentsEnabled: true,
      reviewsEnabled: false,
      onlineListingsEnabled: false,
      phoneCallEnabled: true,
      conversationsEnabled: true,
      assignedDataOnly: true,
      adwordsReportingEnabled: false,
      membershipEnabled: false,
      facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false,
      settingsEnabled: false,
      tagsEnabled: true,
      leadValueEnabled: false,
      marketingEnabled: false,
      agentReportingEnabled: false,
      botService: false,
      socialPlanner: false,
      bloggingEnabled: false,
      invoiceEnabled: false,
      affiliateManagerEnabled: false,
      contentAiEnabled: false,
      refundsEnabled: false,
      recordPaymentEnabled: false,
      cancelSubscriptionEnabled: false,
      paymentsEnabled: false,
      communitiesEnabled: false,
      exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write",
      "calendars.readonly", "calendars/events.write",
      "conversations.write", "conversations.readonly",
      "conversations/message.readonly", "conversations/message.write",
      "opportunities.write",
      "locations/tags.write", "locations/tags.readonly",
      "reporting/phone.readonly",
    ],
  },

  /**
   * Closer: Cierra ventas y gestiona pagos.
   * Similar al Setter pero con acceso a pagos, invoices, lead value.
   * Sin refunds ni cancelaciones de suscripción.
   */
  closer: {
    permissions: {
      campaignsEnabled: false,
      campaignsReadOnly: false,
      contactsEnabled: true,
      workflowsEnabled: false,
      workflowsReadOnly: false,
      triggersEnabled: false,
      funnelsEnabled: false,
      websitesEnabled: false,
      opportunitiesEnabled: true,
      dashboardStatsEnabled: false,
      bulkRequestsEnabled: false,
      appointmentsEnabled: true,
      reviewsEnabled: false,
      onlineListingsEnabled: false,
      phoneCallEnabled: true,
      conversationsEnabled: true,
      assignedDataOnly: true,
      adwordsReportingEnabled: false,
      membershipEnabled: false,
      facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false,
      settingsEnabled: false,
      tagsEnabled: true,
      leadValueEnabled: true,
      marketingEnabled: false,
      agentReportingEnabled: false,
      botService: false,
      socialPlanner: false,
      bloggingEnabled: false,
      invoiceEnabled: true,
      affiliateManagerEnabled: false,
      contentAiEnabled: false,
      refundsEnabled: false,
      recordPaymentEnabled: true,
      cancelSubscriptionEnabled: false,
      paymentsEnabled: true,
      communitiesEnabled: false,
      exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write",
      "calendars.readonly", "calendars/events.write",
      "conversations.write", "conversations.readonly",
      "conversations/message.readonly", "conversations/message.write",
      "opportunities.write", "opportunities/leadValue.readonly",
      "locations/tags.write", "locations/tags.readonly",
      "reporting/phone.readonly",
      "payments.write", "payments/records.write",
      "payments/orders.readonly", "payments/orders.collectPayment",
      "payments/transactions.readonly", "payments/transactions.viewReceipts",
      "invoices.write", "invoices.readonly",
      "products.readonly",
    ],
  },

  /**
   * CSM (Customer Success Manager): Monitorea salud del cliente post-venta.
   * Acceso a reportes, dashboards, reputación, memberships, communities.
   * Workflows en read-only. Sin pagos ni configuración.
   */
  csm: {
    permissions: {
      campaignsEnabled: false,
      campaignsReadOnly: false,
      contactsEnabled: true,
      workflowsEnabled: true,
      workflowsReadOnly: true,
      triggersEnabled: false,
      funnelsEnabled: false,
      websitesEnabled: false,
      opportunitiesEnabled: true,
      dashboardStatsEnabled: true,
      bulkRequestsEnabled: false,
      appointmentsEnabled: true,
      reviewsEnabled: true,
      onlineListingsEnabled: true,
      phoneCallEnabled: true,
      conversationsEnabled: true,
      assignedDataOnly: false,
      adwordsReportingEnabled: false,
      membershipEnabled: true,
      facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: true,
      settingsEnabled: false,
      tagsEnabled: true,
      leadValueEnabled: true,
      marketingEnabled: false,
      agentReportingEnabled: true,
      botService: false,
      socialPlanner: false,
      bloggingEnabled: false,
      invoiceEnabled: false,
      affiliateManagerEnabled: false,
      contentAiEnabled: false,
      refundsEnabled: false,
      recordPaymentEnabled: false,
      cancelSubscriptionEnabled: false,
      paymentsEnabled: false,
      communitiesEnabled: true,
      exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write",
      "calendars.readonly", "calendars/events.write",
      "conversations.write", "conversations.readonly",
      "conversations/message.readonly", "conversations/message.write",
      "opportunities.write", "opportunities/leadValue.readonly",
      "workflows.readonly",
      "locations/tags.write", "locations/tags.readonly",
      "reporting/phone.readonly", "reporting/attributions.readonly",
      "reporting/reports.readonly", "reporting/agent.readonly",
      "dashboard/stats.readonly",
      "reputation/review.write", "reputation/listing.write",
      "reputation/reviewsAIAgents.write", "reputation/gbp.write",
      "membership.write", "communities.write",
      "certificates.write", "certificates.readonly",
    ],
  },

  /**
   * Onboarding: Configura la subcuenta del cliente nuevo.
   * Acceso completo a workflows, funnels, websites, campañas, bots,
   * social planner, memberships, communities, content AI.
   * Sin acceso a conversaciones, oportunidades, pagos ni reportes de ads.
   */
  onboarding: {
    permissions: {
      campaignsEnabled: true,
      campaignsReadOnly: false,
      contactsEnabled: true,
      workflowsEnabled: true,
      workflowsReadOnly: false,
      triggersEnabled: true,
      funnelsEnabled: true,
      websitesEnabled: true,
      opportunitiesEnabled: false,
      dashboardStatsEnabled: false,
      bulkRequestsEnabled: true,
      appointmentsEnabled: true,
      reviewsEnabled: false,
      onlineListingsEnabled: false,
      phoneCallEnabled: false,
      conversationsEnabled: false,
      assignedDataOnly: false,
      adwordsReportingEnabled: false,
      membershipEnabled: true,
      facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false,
      settingsEnabled: false,
      tagsEnabled: true,
      leadValueEnabled: false,
      marketingEnabled: true,
      agentReportingEnabled: false,
      botService: true,
      socialPlanner: true,
      bloggingEnabled: true,
      invoiceEnabled: false,
      affiliateManagerEnabled: false,
      contentAiEnabled: true,
      refundsEnabled: false,
      recordPaymentEnabled: false,
      cancelSubscriptionEnabled: false,
      paymentsEnabled: false,
      communitiesEnabled: true,
      exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write", "contacts/bulkActions.write",
      "campaigns.readonly", "campaigns.write",
      "calendars.readonly", "calendars/events.write",
      "calendars/groups.write", "calendars.write",
      "workflows.readonly", "workflows.write", "triggers.write",
      "funnels.write", "forms.write", "surveys.write", "quizzes.write",
      "websites.write", "medias.write", "medias.readonly",
      "locations/tags.write", "locations/tags.readonly",
      "marketing.write", "eliza.write", "contentAI.write",
      "socialplanner/post.write", "socialplanner/account.readonly",
      "socialplanner/account.write", "socialplanner/category.readonly",
      "socialplanner/category.write", "socialplanner/csv.readonly",
      "socialplanner/csv.write", "socialplanner/group.write",
      "socialplanner/hashtag.readonly", "socialplanner/hashtag.write",
      "socialplanner/oauth.readonly", "socialplanner/oauth.write",
      "socialplanner/post.readonly", "socialplanner/recurring.readonly",
      "socialplanner/recurring.write", "socialplanner/review.readonly",
      "socialplanner/review.write", "socialplanner/rss.readonly",
      "socialplanner/rss.write", "socialplanner/search.readonly",
      "socialplanner/setting.readonly", "socialplanner/setting.write",
      "socialplanner/stat.readonly", "socialplanner/tag.readonly",
      "socialplanner/tag.write", "socialplanner/filters.readonly",
      "socialplanner/medias.readonly", "socialplanner/medias.write",
      "socialplanner/watermarks.readonly", "socialplanner/watermarks.write",
      "socialplanner/metatag.readonly", "socialplanner/facebook.readonly",
      "socialplanner/linkedin.readonly", "socialplanner/twitter.readonly",
      "socialplanner/notification.readonly", "socialplanner/notification.write",
      "socialplanner/snapshot.readonly", "socialplanner/snapshot.write",
      "blogs.write", "membership.write", "communities.write",
      "gokollab.write", "certificates.write", "certificates.readonly",
      "voice-ai-agents.write", "voice-ai-agents.readonly",
      "voice-ai-common.readonly", "voice-ai-common.write",
      "voice-ai-agent-goals.readonly", "voice-ai-agent-goals.write",
      "text-ai-agents.write", "text-ai-agent-goals.readonly",
      "text-ai-agent-goals.write", "text-ai-agent-training.write",
    ],
  },
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
 *     role (string, optional) — "owner" | "admin" | "setter" | "closer" | "csm" | "onboarding"
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

  // Resolver rol → permisos y scopes (con alias para valores de formulario)
  const ROLE_ALIASES = {
    "owner": "owner",
    "admin": "admin",
    "setter": "setter",
    "closer": "closer",
    "onboarding rep": "onboarding",
    "onboarding": "onboarding",
    "customer success rep": "csm",
    "csm": "csm",
  };

  const roleName = ROLE_ALIASES[(user.role || "owner").toLowerCase().trim()] || null;

  if (!roleName) {
    const available = Object.keys(ROLE_ALIASES).join(", ");
    return sendError(res, 400, `Unknown role "${user.role}". Available: ${available}`);
  }

  const roleConfig = ROLES[roleName];

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
