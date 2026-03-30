// api/create-user.js
// Crea un único usuario en la subcuenta del cliente.
// Refactorizado para delegar la lógica core a lib/user-core.js

const { createUserCore } = require("../lib/user-core");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

/**

- POST /api/create-user
- 
- Body (application/json):
- companyId  (string, required)
- locationId (string, required)
- user (object, required):
- ```
  firstName        (string, required)
  ```
- ```
  lastName         (string, required)
  ```
- ```
  email            (string, required)
  ```
- ```
  phone            (string, optional)
  ```
- ```
  role             (string, optional) — owner | admin | setter | closer | csm | onboarding
  ```
- ```
  profilePhoto     (string, optional)
  ```
- ```
  platformLanguage (string, optional)
  ```

*/
module.exports = async function handler(req, res) {
if (req.method !== “POST”) {
return sendError(res, 405, “Method not allowed. Use POST.”);
}

if (!validateWebhookSecret(req)) {
return sendError(res, 401, “Unauthorized.”);
}

const { companyId, locationId, user } = req.body || {};

if (!companyId)   return sendError(res, 400, ‘Missing “companyId”.’);
if (!locationId)  return sendError(res, 400, ‘Missing “locationId”.’);
if (!user || !user.firstName || !user.lastName || !user.email) {
return sendError(res, 400, “Missing user data. Required: firstName, lastName, email.”);
}

try {
const data = await createUserCore({ companyId, locationId, user });
return sendResponse(res, 200, data);
} catch (err) {
console.error(“Error creating user:”, err);
return sendError(res, 500, “Failed to create user.”, err.message);
}
};
