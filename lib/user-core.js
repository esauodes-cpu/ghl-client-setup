// lib/user-core.js
// Lógica compartida de creación de usuarios.
// Usada por /api/create-user y /api/bulk-create-users.

const { createUser } = require(”./ghl-api”);
const crypto = require(“crypto”);

// ============================================================
// TEMP PASSWORD GENERATOR
// ============================================================

function generateTempPassword() {
const words = [
“Sun”, “Rock”, “Wave”, “Fire”, “Star”, “Moon”, “Wind”, “Peak”,
“Lake”, “Rain”, “Gold”, “Blue”, “Jade”, “Oak”, “Reef”, “Sky”,
“Fox”, “Bear”, “Hawk”, “Wolf”, “Pine”, “Sage”, “Iron”, “Bolt”,
];
const pick = () => words[crypto.randomInt(words.length)];
const digits = crypto.randomInt(1000, 9999);
return `${pick()}-${pick()}-${pick()}-${digits}`;
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

const ROLES = {
owner: {
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
“campaigns.readonly”,“campaigns.write”,“calendars.readonly”,“calendars/events.write”,
“calendars/groups.write”,“calendars.write”,“contacts.write”,“contacts/bulkActions.write”,
“workflows.readonly”,“workflows.write”,“triggers.write”,“funnels.write”,“forms.write”,
“surveys.write”,“quizzes.write”,“websites.write”,“medias.write”,“medias.readonly”,
“opportunities.write”,“opportunities/leadValue.readonly”,“opportunities/bulkActions.write”,
“reporting/phone.readonly”,“reporting/adwords.readonly”,“reporting/facebookAds.readonly”,
“reporting/attributions.readonly”,“reporting/reports.readonly”,“reporting/agent.readonly”,
“reporting/reports.write”,“reporting/stats.export”,“payments.write”,“payments/records.write”,
“payments/orders.readonly”,“payments/orders.export”,“payments/orders.import”,
“payments/orders.collectPayment”,“payments/subscriptions.readonly”,
“payments/subscriptions.write”,“payments/subscriptions.update”,
“payments/subscriptions.export”,“payments/subscriptions.pauseResumeCancel”,
“payments/subscriptions.sharePaymentMethod”,“payments/transactions.readonly”,
“payments/transactions.export”,“payments/transactions.import”,“payments/transactions.refund”,
“payments/transactions.viewReceipts”,“payments/taxesSettings.readonly”,
“payments/settings.readonly”,“invoices.write”,“invoices.readonly”,
“reputation/review.write”,“reputation/listing.write”,“conversations.write”,
“conversations.readonly”,“conversations/message.readonly”,“conversations/message.write”,
“contentAI.write”,“dashboard/stats.readonly”,“locations/tags.write”,“locations/tags.readonly”,
“marketing.write”,“settings.write”,“socialplanner/post.write”,“blogs.write”,
“membership.write”,“communities.write”,“certificates.write”,“certificates.readonly”,
“users/team-management.write”,“users/team-management.readonly”,
],
},
admin: {
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
“campaigns.readonly”,“campaigns.write”,“calendars.readonly”,“calendars/events.write”,
“calendars/groups.write”,“calendars.write”,“contacts.write”,“contacts/bulkActions.write”,
“workflows.readonly”,“workflows.write”,“triggers.write”,“funnels.write”,“forms.write”,
“surveys.write”,“quizzes.write”,“websites.write”,“medias.write”,“medias.readonly”,
“opportunities.write”,“opportunities/leadValue.readonly”,“opportunities/bulkActions.write”,
“reporting/phone.readonly”,“reporting/adwords.readonly”,“reporting/facebookAds.readonly”,
“reporting/attributions.readonly”,“reporting/reports.readonly”,“reporting/agent.readonly”,
“reporting/reports.write”,“payments.write”,“payments/records.write”,
“payments/orders.readonly”,“payments/orders.collectPayment”,“payments/subscriptions.readonly”,
“payments/transactions.readonly”,“payments/transactions.viewReceipts”,
“invoices.write”,“invoices.readonly”,“reputation/review.write”,“reputation/listing.write”,
“conversations.write”,“conversations.readonly”,“conversations/message.readonly”,
“conversations/message.write”,“contentAI.write”,“dashboard/stats.readonly”,
“locations/tags.write”,“locations/tags.readonly”,“marketing.write”,“socialplanner/post.write”,
“blogs.write”,“membership.write”,“communities.write”,“certificates.write”,
“certificates.readonly”,“users/team-management.write”,“users/team-management.readonly”,
],
},
setter: {
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
“contacts.write”,“calendars.readonly”,“calendars/events.write”,
“conversations.write”,“conversations.readonly”,“conversations/message.readonly”,
“conversations/message.write”,“opportunities.write”,“locations/tags.write”,
“locations/tags.readonly”,“reporting/phone.readonly”,
],
},
closer: {
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
“contacts.write”,“calendars.readonly”,“calendars/events.write”,
“conversations.write”,“conversations.readonly”,“conversations/message.readonly”,
“conversations/message.write”,“opportunities.write”,“opportunities/leadValue.readonly”,
“locations/tags.write”,“locations/tags.readonly”,“reporting/phone.readonly”,
“payments.write”,“payments/records.write”,“payments/orders.readonly”,
“payments/orders.collectPayment”,“payments/transactions.readonly”,
“payments/transactions.viewReceipts”,“invoices.write”,“invoices.readonly”,“products.readonly”,
],
},
csm: {
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
“contacts.write”,“calendars.readonly”,“calendars/events.write”,
“conversations.write”,“conversations.readonly”,“conversations/message.readonly”,
“conversations/message.write”,“opportunities.write”,“opportunities/leadValue.readonly”,
“workflows.readonly”,“locations/tags.write”,“locations/tags.readonly”,
“reporting/phone.readonly”,“reporting/attributions.readonly”,“reporting/reports.readonly”,
“reporting/agent.readonly”,“dashboard/stats.readonly”,“reputation/review.write”,
“reputation/listing.write”,“membership.write”,“communities.write”,
“certificates.write”,“certificates.readonly”,
],
},
onboarding: {
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
“contacts.write”,“contacts/bulkActions.write”,“campaigns.readonly”,“campaigns.write”,
“calendars.readonly”,“calendars/events.write”,“calendars/groups.write”,“calendars.write”,
“workflows.readonly”,“workflows.write”,“triggers.write”,“funnels.write”,“forms.write”,
“surveys.write”,“quizzes.write”,“websites.write”,“medias.write”,“medias.readonly”,
“locations/tags.write”,“locations/tags.readonly”,“marketing.write”,“eliza.write”,
“contentAI.write”,“socialplanner/post.write”,“blogs.write”,“membership.write”,
“communities.write”,“certificates.write”,“certificates.readonly”,
],
},
};

const ROLE_ALIASES = {
“owner”: “owner”,
“admin”: “admin”,
“setter”: “setter”,
“closer”: “closer”,
“onboarding rep”: “onboarding”,
“onboarding”: “onboarding”,
“customer success rep”: “csm”,
“csm”: “csm”,
};

// ============================================================
// CORE FUNCTION
// ============================================================

/**

- Crea un usuario en GHL.
- 
- @param {object} params
- @param {string} params.companyId
- @param {string} params.locationId
- @param {object} params.user - { firstName, lastName, email, phone?, role?, profilePhoto?, platformLanguage? }
- @returns {Promise<{ success: boolean, userId?, email, role, tempPassword?, loginUrl?, result?, error? }>}
  */
  async function createUserCore({ companyId, locationId, user }) {
  const roleName = ROLE_ALIASES[(user.role || “owner”).toLowerCase().trim()] || null;

if (!roleName) {
const available = Object.keys(ROLE_ALIASES).join(”, “);
throw new Error(`Unknown role "${user.role}". Available: ${available}`);
}

const roleConfig = ROLES[roleName];
const tempPassword = generateTempPassword();

const userData = {
firstName: user.firstName,
lastName: user.lastName,
email: user.email,
password: tempPassword,
type: “account”,
role: “admin”,
permissions: roleConfig.permissions,
scopes: roleConfig.scopes,
scopesAssignedToOnly: roleConfig.scopes,
};

if (user.phone) userData.phone = user.phone;
if (user.profilePhoto) userData.profilePhoto = user.profilePhoto;
if (user.platformLanguage) userData.platformLanguage = user.platformLanguage;

const result = await createUser(companyId, locationId, userData);

return {
success: true,
locationId,
userId: result.id || result.userId,
email: user.email,
role: roleName,
tempPassword,
loginUrl: process.env.GHL_LOGIN_URL || “https://app.gohighlevel.com/”,
result,
};
}

module.exports = { createUserCore, ROLE_ALIASES };
