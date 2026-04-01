// lib/user-core.js
//
// Adaptado al nuevo flujo de creación de usuarios de GHL (2024+):
// GHL ya NO permite que admins o la API establezcan contraseñas para usuarios nuevos.
// Al crear un usuario, GHL envía automáticamente un email de activación
// con un enlace para que el usuario establezca su propia contraseña.
//
// Ref: https://ideas.gohighlevel.com/changelog/user-management-enhancements-to-new-user-creation-flow

const { createUser } = require("./ghl-api");

var ROLES = {
  owner: {
    ghlRole: "admin",
    permissions: {
      campaignsEnabled: true, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: true, workflowsReadOnly: false, triggersEnabled: true,
      funnelsEnabled: true, websitesEnabled: true, opportunitiesEnabled: true,
      dashboardStatsEnabled: true, bulkRequestsEnabled: true, appointmentsEnabled: true,
      reviewsEnabled: true, onlineListingsEnabled: true, phoneCallEnabled: true,
      conversationsEnabled: true, assignedDataOnly: false, adwordsReportingEnabled: true,
      membershipEnabled: true, facebookAdsReportingEnabled: true,
      attributionsReportingEnabled: true, settingsEnabled: true, tagsEnabled: true,
      leadValueEnabled: true, marketingEnabled: true, agentReportingEnabled: true,
      botService: true, socialPlanner: true, bloggingEnabled: true, invoiceEnabled: true,
      affiliateManagerEnabled: true, contentAiEnabled: true, refundsEnabled: true,
      recordPaymentEnabled: true, cancelSubscriptionEnabled: true, paymentsEnabled: true,
      communitiesEnabled: true, exportPaymentsEnabled: true,
    },
    scopes: [
      "campaigns.readonly","campaigns.write","calendars.readonly","calendars/events.write",
      "calendars/groups.write","calendars.write","contacts.write","contacts/bulkActions.write",
      "workflows.readonly","workflows.write","triggers.write","funnels.write","forms.write",
      "surveys.write","quizzes.write","websites.write","medias.write","medias.readonly",
      "opportunities.write","opportunities/leadValue.readonly","opportunities/bulkActions.write",
      "reporting/phone.readonly","reporting/adwords.readonly","reporting/facebookAds.readonly",
      "reporting/attributions.readonly","reporting/reports.readonly","reporting/agent.readonly",
      "reporting/reports.write","reporting/stats.export","payments.write","payments/records.write",
      "payments/orders.readonly","payments/orders.export","payments/orders.import",
      "payments/orders.collectPayment","payments/subscriptions.readonly",
      "payments/subscriptions.write","payments/subscriptions.update",
      "payments/subscriptions.export","payments/subscriptions.pauseResumeCancel",
      "payments/subscriptions.sharePaymentMethod","payments/transactions.readonly",
      "payments/transactions.export","payments/transactions.import","payments/transactions.refund",
      "payments/transactions.viewReceipts","payments/taxesSettings.readonly",
      "payments/settings.readonly","invoices.write","invoices.readonly",
      "reputation/review.write","reputation/listing.write","conversations.write",
      "conversations.readonly","conversations/message.readonly","conversations/message.write",
      "contentAI.write","dashboard/stats.readonly","locations/tags.write","locations/tags.readonly",
      "marketing.write","settings.write","socialplanner/post.write","blogs.write",
      "membership.write","communities.write","certificates.write","certificates.readonly",
      "users/team-management.write","users/team-management.readonly",
    ],
  },
  admin: {
    ghlRole: "admin",
    permissions: {
      campaignsEnabled: true, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: true, workflowsReadOnly: false, triggersEnabled: true,
      funnelsEnabled: true, websitesEnabled: true, opportunitiesEnabled: true,
      dashboardStatsEnabled: true, bulkRequestsEnabled: true, appointmentsEnabled: true,
      reviewsEnabled: true, onlineListingsEnabled: true, phoneCallEnabled: true,
      conversationsEnabled: true, assignedDataOnly: false, adwordsReportingEnabled: true,
      membershipEnabled: true, facebookAdsReportingEnabled: true,
      attributionsReportingEnabled: true, settingsEnabled: false, tagsEnabled: true,
      leadValueEnabled: true, marketingEnabled: true, agentReportingEnabled: true,
      botService: true, socialPlanner: true, bloggingEnabled: true, invoiceEnabled: true,
      affiliateManagerEnabled: true, contentAiEnabled: true, refundsEnabled: true,
      recordPaymentEnabled: true, cancelSubscriptionEnabled: true, paymentsEnabled: true,
      communitiesEnabled: true, exportPaymentsEnabled: true,
    },
    scopes: [
      "campaigns.readonly","campaigns.write","calendars.readonly","calendars/events.write",
      "calendars/groups.write","calendars.write","contacts.write","contacts/bulkActions.write",
      "workflows.readonly","workflows.write","triggers.write","funnels.write","forms.write",
      "surveys.write","quizzes.write","websites.write","medias.write","medias.readonly",
      "opportunities.write","opportunities/leadValue.readonly","opportunities/bulkActions.write",
      "reporting/phone.readonly","reporting/adwords.readonly","reporting/facebookAds.readonly",
      "reporting/attributions.readonly","reporting/reports.readonly","reporting/agent.readonly",
      "reporting/reports.write","payments.write","payments/records.write",
      "payments/orders.readonly","payments/orders.collectPayment","payments/subscriptions.readonly",
      "payments/transactions.readonly","payments/transactions.viewReceipts",
      "invoices.write","invoices.readonly","reputation/review.write","reputation/listing.write",
      "conversations.write","conversations.readonly","conversations/message.readonly",
      "conversations/message.write","contentAI.write","dashboard/stats.readonly",
      "locations/tags.write","locations/tags.readonly","marketing.write","socialplanner/post.write",
      "blogs.write","membership.write","communities.write","certificates.write",
      "certificates.readonly","users/team-management.write","users/team-management.readonly",
    ],
  },
  setter: {
    ghlRole: "user",
    permissions: {
      campaignsEnabled: false, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: false, workflowsReadOnly: false, triggersEnabled: false,
      funnelsEnabled: false, websitesEnabled: false, opportunitiesEnabled: true,
      dashboardStatsEnabled: false, bulkRequestsEnabled: false, appointmentsEnabled: true,
      reviewsEnabled: false, onlineListingsEnabled: false, phoneCallEnabled: true,
      conversationsEnabled: true, assignedDataOnly: true, adwordsReportingEnabled: false,
      membershipEnabled: false, facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false, settingsEnabled: false, tagsEnabled: true,
      leadValueEnabled: false, marketingEnabled: false, agentReportingEnabled: false,
      botService: false, socialPlanner: false, bloggingEnabled: false, invoiceEnabled: false,
      affiliateManagerEnabled: false, contentAiEnabled: false, refundsEnabled: false,
      recordPaymentEnabled: false, cancelSubscriptionEnabled: false, paymentsEnabled: false,
      communitiesEnabled: false, exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write","calendars.readonly","calendars/events.write",
      "conversations.write","conversations.readonly","conversations/message.readonly",
      "conversations/message.write","opportunities.write","locations/tags.write",
      "locations/tags.readonly","reporting/phone.readonly",
    ],
  },
  closer: {
    ghlRole: "user",
    permissions: {
      campaignsEnabled: false, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: false, workflowsReadOnly: false, triggersEnabled: false,
      funnelsEnabled: false, websitesEnabled: false, opportunitiesEnabled: true,
      dashboardStatsEnabled: false, bulkRequestsEnabled: false, appointmentsEnabled: true,
      reviewsEnabled: false, onlineListingsEnabled: false, phoneCallEnabled: true,
      conversationsEnabled: true, assignedDataOnly: true, adwordsReportingEnabled: false,
      membershipEnabled: false, facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false, settingsEnabled: false, tagsEnabled: true,
      leadValueEnabled: true, marketingEnabled: false, agentReportingEnabled: false,
      botService: false, socialPlanner: false, bloggingEnabled: false, invoiceEnabled: true,
      affiliateManagerEnabled: false, contentAiEnabled: false, refundsEnabled: false,
      recordPaymentEnabled: true, cancelSubscriptionEnabled: false, paymentsEnabled: true,
      communitiesEnabled: false, exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write","calendars.readonly","calendars/events.write",
      "conversations.write","conversations.readonly","conversations/message.readonly",
      "conversations/message.write","opportunities.write","opportunities/leadValue.readonly",
      "locations/tags.write","locations/tags.readonly","reporting/phone.readonly",
      "payments.write","payments/records.write","payments/orders.readonly",
      "payments/orders.collectPayment","payments/transactions.readonly",
      "payments/transactions.viewReceipts","invoices.write","invoices.readonly","products.readonly",
    ],
  },
  csm: {
    ghlRole: "user",
    permissions: {
      campaignsEnabled: false, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: true, workflowsReadOnly: true, triggersEnabled: false,
      funnelsEnabled: false, websitesEnabled: false, opportunitiesEnabled: true,
      dashboardStatsEnabled: true, bulkRequestsEnabled: false, appointmentsEnabled: true,
      reviewsEnabled: true, onlineListingsEnabled: true, phoneCallEnabled: true,
      conversationsEnabled: true, assignedDataOnly: false, adwordsReportingEnabled: false,
      membershipEnabled: true, facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: true, settingsEnabled: false, tagsEnabled: true,
      leadValueEnabled: true, marketingEnabled: false, agentReportingEnabled: true,
      botService: false, socialPlanner: false, bloggingEnabled: false, invoiceEnabled: false,
      affiliateManagerEnabled: false, contentAiEnabled: false, refundsEnabled: false,
      recordPaymentEnabled: false, cancelSubscriptionEnabled: false, paymentsEnabled: false,
      communitiesEnabled: true, exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write","calendars.readonly","calendars/events.write",
      "conversations.write","conversations.readonly","conversations/message.readonly",
      "conversations/message.write","opportunities.write","opportunities/leadValue.readonly",
      "workflows.readonly","locations/tags.write","locations/tags.readonly",
      "reporting/phone.readonly","reporting/attributions.readonly","reporting/reports.readonly",
      "reporting/agent.readonly","dashboard/stats.readonly","reputation/review.write",
      "reputation/listing.write","membership.write","communities.write",
      "certificates.write","certificates.readonly",
    ],
  },
  onboarding: {
    ghlRole: "user",
    permissions: {
      campaignsEnabled: true, campaignsReadOnly: false, contactsEnabled: true,
      workflowsEnabled: true, workflowsReadOnly: false, triggersEnabled: true,
      funnelsEnabled: true, websitesEnabled: true, opportunitiesEnabled: false,
      dashboardStatsEnabled: false, bulkRequestsEnabled: true, appointmentsEnabled: true,
      reviewsEnabled: false, onlineListingsEnabled: false, phoneCallEnabled: false,
      conversationsEnabled: false, assignedDataOnly: false, adwordsReportingEnabled: false,
      membershipEnabled: true, facebookAdsReportingEnabled: false,
      attributionsReportingEnabled: false, settingsEnabled: false, tagsEnabled: true,
      leadValueEnabled: false, marketingEnabled: true, agentReportingEnabled: false,
      botService: true, socialPlanner: true, bloggingEnabled: true, invoiceEnabled: false,
      affiliateManagerEnabled: false, contentAiEnabled: true, refundsEnabled: false,
      recordPaymentEnabled: false, cancelSubscriptionEnabled: false, paymentsEnabled: false,
      communitiesEnabled: true, exportPaymentsEnabled: false,
    },
    scopes: [
      "contacts.write","contacts/bulkActions.write","campaigns.readonly","campaigns.write",
      "calendars.readonly","calendars/events.write","calendars/groups.write","calendars.write",
      "workflows.readonly","workflows.write","triggers.write","funnels.write","forms.write",
      "surveys.write","quizzes.write","websites.write","medias.write","medias.readonly",
      "locations/tags.write","locations/tags.readonly","marketing.write","eliza.write",
      "contentAI.write","socialplanner/post.write","blogs.write","membership.write",
      "communities.write","certificates.write","certificates.readonly",
    ],
  },
};

var ROLE_ALIASES = {
  "owner": "owner",
  "admin": "admin",
  "setter": "setter",
  "closer": "closer",
  "onboarding rep": "onboarding",
  "onboarding": "onboarding",
  "customer success rep": "csm",
  "csm": "csm",
};

async function createUserCore(params) {
  var companyId = params.companyId;
  var locationId = params.locationId;
  var user = params.user;

  var roleKey = (user.role || "owner").toLowerCase().trim();
  var roleName = ROLE_ALIASES[roleKey] || null;

  if (!roleName) {
    var available = Object.keys(ROLE_ALIASES).join(", ");
    throw new Error("Unknown role \"" + user.role + "\". Available: " + available);
  }

  var roleConfig = ROLES[roleName];

  // Determinar el role de GHL (admin o user) según la config del rol
  var ghlRole = roleConfig.ghlRole || "user";

  // NO enviamos password — GHL ignora este campo desde 2024.
  // GHL envía automáticamente un email de activación al usuario
  // para que establezca su propia contraseña.
  var userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    type: "account",
    role: ghlRole,
    permissions: roleConfig.permissions,
    scopes: roleConfig.scopes,
    scopesAssignedToOnly: roleConfig.scopes,
  };

  if (user.phone) userData.phone = user.phone;
  if (user.profilePhoto) userData.profilePhoto = user.profilePhoto;
  if (user.platformLanguage) userData.platformLanguage = user.platformLanguage;

  var result = await createUser(companyId, locationId, userData);

  var loginUrl = process.env.GHL_LOGIN_URL || "https://app.gohighlevel.com/";

  return {
    success: true,
    locationId: locationId,
    userId: result.id || result.userId,
    email: user.email,
    role: roleName,
    ghlRole: ghlRole,
    loginUrl: loginUrl,
    passwordNote: "GHL enviará un email de activación al usuario. "
      + "Debe hacer clic en el enlace del email para establecer su contraseña. "
      + "Si no lo recibe, el admin puede reenviar desde Teams > Verification Email.",
    result: result,
  };
}

module.exports = { createUserCore: createUserCore, ROLE_ALIASES: ROLE_ALIASES };
