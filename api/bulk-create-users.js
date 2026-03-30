// api/bulk-create-users.js
// Recibe un JSON con la URL del archivo de usuarios y los crea en GHL uno por uno.
//
// Dependencias a instalar:
//   npm install papaparse xlsx
//   (ya no necesitas formidable)
//
// Content-Type del request: application/json
// Body:
//   companyId  (string, required)
//   locationId (string, required)
//   fileUrl    (string, required) — Signed URL de GCS donde está el CSV/XLSX

const Papa = require(“papaparse”);
const XLSX = require(“xlsx”);

const { createUserCore } = require(”../lib/user-core”);
const { validateWebhookSecret, sendResponse, sendError } = require(”../lib/helpers”);

// ============================================================
// COLUMN MAP
// Mapea los headers de la plantilla al schema de createUserCore.
// ============================================================
const COLUMN_MAP = {
“nombre(s)”:   “firstName”,
“nombre”:      “firstName”,
“apellido(s)”: “lastName”,
“apellido”:    “lastName”,
“email”:       “email”,
“correo”:      “email”,
“teléfono”:    “phone”,
“telefono”:    “phone”,
“tel”:         “phone”,
“rol”:         “role”,
“role”:        “role”,
};

function normalizeHeader(header) {
return header
.trim()
.toLowerCase()
.normalize(“NFD”)
.replace(/[\u0300-\u036f]/g, “”)
.replace(/\s+/g, “ “);
}

/**

- Parsea el buffer del archivo (CSV o XLSX) y devuelve un array
- de objetos mapeados al schema de usuario.
  */
  function parseBuffer(buffer, contentType, fileUrl) {
  const isXlsx =
  contentType.includes(“spreadsheetml”) ||
  contentType.includes(“ms-excel”) ||
  fileUrl.includes(”.xlsx”) ||
  fileUrl.includes(”.xls”);

let rows = [];

if (isXlsx) {
const workbook = XLSX.read(buffer, { type: “buffer” });
const sheetName = workbook.SheetNames[0];
rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: “” });
} else {
const text = buffer.toString(“utf8”);
const parsed = Papa.parse(text, {
header: true,
skipEmptyLines: true,
transformHeader: (h) => h.trim(),
});
rows = parsed.data;
}

if (!rows || rows.length === 0) {
throw new Error(“The file is empty or has no data rows.”);
}

return rows.map((row, index) => {
const mapped = {};

```
for (const [rawKey, value] of Object.entries(row)) {
  const normalized = normalizeHeader(rawKey);
  const schemaKey = COLUMN_MAP[normalized];
  if (schemaKey && value !== undefined && value !== "") {
    mapped[schemaKey] = String(value).trim();
  }
}

const missing = ["firstName", "lastName", "email"].filter((k) => !mapped[k]);
if (missing.length > 0) {
  mapped._rowIndex = index + 2;
  mapped._missingFields = missing;
}

return mapped;
```

});
}

// ============================================================
// HANDLER
// ============================================================

/**

- POST /api/bulk-create-users
- 
- application/json:
- companyId  (string, required)
- locationId (string, required)
- fileUrl    (string, required) — URL del archivo CSV o XLSX
- 
- Response:
- {
- ```
  total: number,
  ```
- ```
  created: number,
  ```
- ```
  failed: number,
  ```
- ```
  skipped: number,
  ```
- ```
  results: [
  ```
- ```
    { row, email, status: "created"|"failed"|"skipped", userId?, tempPassword?, role?, error? }
  ```
- ```
  ]
  ```
- }
  */
  module.exports = async function handler(req, res) {
  if (req.method !== “POST”) {
  return sendError(res, 405, “Method not allowed. Use POST.”);
  }

if (!validateWebhookSecret(req)) {
return sendError(res, 401, “Unauthorized.”);
}

const { companyId, locationId, fileUrl } = req.body || {};

if (!companyId)  return sendError(res, 400, ‘Missing “companyId”.’);
if (!locationId) return sendError(res, 400, ‘Missing “locationId”.’);
if (!fileUrl)    return sendError(res, 400, ‘Missing “fileUrl”.’);

// Descargar el archivo desde la Signed URL
let fileBuffer;
let contentType = “”;
try {
const fileResponse = await fetch(fileUrl);
if (!fileResponse.ok) {
return sendError(res, 422, `Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
}
contentType = fileResponse.headers.get(“content-type”) || “”;
const arrayBuffer = await fileResponse.arrayBuffer();
fileBuffer = Buffer.from(arrayBuffer);
} catch (err) {
return sendError(res, 422, “Failed to fetch file from URL.”, err.message);
}

// Parsear el archivo
let users;
try {
users = parseBuffer(fileBuffer, contentType, fileUrl);
} catch (err) {
return sendError(res, 422, “Failed to parse file.”, err.message);
}

// Iterar y crear usuarios
const results = [];
let created = 0;
let failed  = 0;
let skipped = 0;

for (let i = 0; i < users.length; i++) {
const user = users[i];
const rowNumber = user._rowIndex || (i + 2);

```
if (user._missingFields && user._missingFields.length > 0) {
  skipped++;
  results.push({
    row: rowNumber,
    email: user.email || null,
    status: "skipped",
    error: `Missing required fields: ${user._missingFields.join(", ")}`,
  });
  continue;
}

try {
  const data = await createUserCore({ companyId, locationId, user });
  created++;
  results.push({
    row: rowNumber,
    email: user.email,
    status: "created",
    userId: data.userId,
    role: data.role,
    tempPassword: data.tempPassword,
  });
} catch (err) {
  failed++;
  results.push({
    row: rowNumber,
    email: user.email,
    status: "failed",
    error: err.message,
  });
}
```

}

return sendResponse(res, 200, {
success: true,
locationId,
total: users.length,
created,
failed,
skipped,
results,
});
};
