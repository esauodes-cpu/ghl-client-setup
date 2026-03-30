// api/bulk-create-users.js
// Recibe un archivo CSV o XLSX con usuarios y los crea en GHL uno por uno.
//
// Dependencias a instalar si no están:
//   npm install formidable papaparse xlsx
//
// Content-Type del request: multipart/form-data
// Campos del form:
//   companyId  (string, required)
//   locationId (string, required)
//   file       (file, required) — .csv o .xlsx

const fs = require(“fs”);
const path = require(“path”);
const formidable = require(“formidable”);
const Papa = require(“papaparse”);
const XLSX = require(“xlsx”);

const { createUserCore } = require(”../lib/user-core”);
const { validateWebhookSecret, sendResponse, sendError } = require(”../lib/helpers”);

// ============================================================
// COLUMN MAP
// Mapea los headers de la plantilla al schema de createUserCore.
// Ajusta aquí si el cliente envía headers en otro idioma/capitalización.
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

/**

- Normaliza el header de una columna al key canónico del schema.
- Elimina espacios extra, convierte a minúsculas y stripea acentos opcionales.
  */
  function normalizeHeader(header) {
  return header
  .trim()
  .toLowerCase()
  .normalize(“NFD”)
  .replace(/[\u0300-\u036f]/g, “”) // strip diacritics
  .replace(/\s+/g, “ “);
  }

/**

- Parsea el archivo (CSV o XLSX) y devuelve un array de objetos
- ya mapeados al schema de usuario.
- 
- @param {string} filePath - Ruta temporal del archivo
- @param {string} mimeType - MIME type del archivo
- @param {string} originalName - Nombre original para inferir extensión
- @returns {Array<{ firstName, lastName, email, phone?, role? }>}
  */
  function parseFile(filePath, mimeType, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let rows = [];

if (ext === “.csv” || mimeType === “text/csv” || mimeType === “text/plain”) {
const content = fs.readFileSync(filePath, “utf8”);
const parsed = Papa.parse(content, {
header: true,
skipEmptyLines: true,
transformHeader: (h) => h.trim(),
});
rows = parsed.data;
} else if (
ext === “.xlsx” || ext === “.xls” ||
mimeType === “application/vnd.openxmlformats-officedocument.spreadsheetml.sheet” ||
mimeType === “application/vnd.ms-excel”
) {
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: “” });
} else {
throw new Error(`Unsupported file type: "${ext || mimeType}". Use .csv or .xlsx`);
}

if (!rows || rows.length === 0) {
throw new Error(“The file is empty or has no data rows.”);
}

// Mapear headers de la plantilla al schema interno
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

// Validación mínima por fila
const missing = ["firstName", "lastName", "email"].filter((k) => !mapped[k]);
if (missing.length > 0) {
  mapped._rowIndex = index + 2; // +2 = header row + 1-based index
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
- multipart/form-data:
- companyId  (string, required)
- locationId (string, required)
- file       (file, required) — CSV o XLSX con columnas:
- ```
           Nombre(s) | Apellido(s) | Email | Teléfono | Rol
  ```
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

// Parsear el multipart/form-data
const form = formidable({
maxFileSize: 5 * 1024 * 1024, // 5 MB máximo
keepExtensions: true,
allowEmptyFiles: false,
});

let fields, files;
try {
[fields, files] = await form.parse(req);
} catch (err) {
return sendError(res, 400, “Failed to parse form data.”, err.message);
}

// formidable v3 devuelve arrays — tomar el primer valor
const companyId  = Array.isArray(fields.companyId)  ? fields.companyId[0]  : fields.companyId;
const locationId = Array.isArray(fields.locationId) ? fields.locationId[0] : fields.locationId;
const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

if (!companyId)     return sendError(res, 400, ‘Missing field “companyId”.’);
if (!locationId)    return sendError(res, 400, ‘Missing field “locationId”.’);
if (!uploadedFile)  return sendError(res, 400, ‘Missing field “file”.’);

// Parsear el archivo
let users;
try {
users = parseFile(
uploadedFile.filepath,
uploadedFile.mimetype,
uploadedFile.originalFilename || “upload”
);
} catch (err) {
return sendError(res, 422, “Failed to parse file.”, err.message);
}

// Iterar usuarios y crear uno por uno
const results = [];
let created = 0;
let failed = 0;
let skipped = 0;

for (let i = 0; i < users.length; i++) {
const user = users[i];
const rowNumber = (user._rowIndex) || (i + 2); // fila real en el archivo

```
// Saltar filas con campos requeridos faltantes
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

// Limpiar archivo temporal
try {
fs.unlinkSync(uploadedFile.filepath);
} catch (_) {
// No crítico si falla la limpieza
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
