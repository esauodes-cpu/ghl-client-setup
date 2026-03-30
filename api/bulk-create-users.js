// api/bulk-create-users.js
const Papa = require("papaparse");
const XLSX = require("xlsx");

const { createUserCore } = require("../lib/user-core");
const { validateWebhookSecret, sendResponse, sendError } = require("../lib/helpers");

var COLUMN_MAP = {
  "nombre(s)":   "firstName",
  "nombre":      "firstName",
  "apellido(s)": "lastName",
  "apellido":    "lastName",
  "email":       "email",
  "correo":      "email",
  "telefono":    "phone",
  "tel":         "phone",
  "rol":         "role",
  "role":        "role",
};

function normalizeHeader(header) {
  return String(header)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function parseBuffer(buffer, contentType, fileUrl) {
  var isXlsx =
    contentType.includes("spreadsheetml") ||
    contentType.includes("ms-excel") ||
    fileUrl.includes(".xlsx") ||
    fileUrl.includes(".xls");

  var rows = [];

  if (isXlsx) {
    var workbook = XLSX.read(buffer, { type: "buffer" });
    var sheetName = workbook.SheetNames[0];
    var sheet = workbook.Sheets[sheetName];

    // Obtener el rango real de la hoja para ignorar columnas vacias
    var ref = sheet["!ref"];
    var range = XLSX.utils.decode_range(ref);

    // Leer headers de la primera fila para construir un mapa de columna -> header
    var headerMap = {};
    for (var col = range.s.c; col <= range.e.c; col++) {
      var cellAddr = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      var cell = sheet[cellAddr];
      if (cell && cell.v !== undefined && cell.v !== null && cell.v !== "") {
        headerMap[col] = cell.v;
      }
    }

    // Leer filas de datos manualmente ignorando columnas sin header
    for (var row = range.s.r + 1; row <= range.e.r; row++) {
      var rowObj = {};
      var hasData = false;

      Object.keys(headerMap).forEach(function(col) {
        var header = headerMap[col];
        var cellAddr = XLSX.utils.encode_cell({ r: row, c: parseInt(col) });
        var cell = sheet[cellAddr];
        var value = (cell && cell.v !== undefined) ? String(cell.v).trim() : "";
        rowObj[header] = value;
        if (value !== "") hasData = true;
      });

      if (hasData) rows.push(rowObj);
    }
  } else {
    var text = buffer.toString("utf8");
    var parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: function(h) { return h.trim(); },
    });
    rows = parsed.data;
  }

  if (!rows || rows.length === 0) {
    throw new Error("The file is empty or has no data rows.");
  }

  return rows.map(function(row, index) {
    var mapped = {};

    Object.keys(row).forEach(function(rawKey) {
      // Ignorar keys vacias o generadas automaticamente por xlsx
      if (!rawKey || rawKey.startsWith("__")) return;
      var value = row[rawKey];
      var normalized = normalizeHeader(rawKey);
      var schemaKey = COLUMN_MAP[normalized];
      if (schemaKey && value !== undefined && value !== "") {
        mapped[schemaKey] = String(value).trim();
      }
    });

    var missing = ["firstName", "lastName", "email"].filter(function(k) { return !mapped[k]; });
    if (missing.length > 0) {
      mapped._rowIndex = index + 2;
      mapped._missingFields = missing;
    }

    return mapped;
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed. Use POST.");
  }

  if (!validateWebhookSecret(req)) {
    return sendError(res, 401, "Unauthorized.");
  }

  var body = req.body || {};
  var companyId = body.companyId;
  var locationId = body.locationId;
  var fileUrl = body.fileUrl;

  if (!companyId)  return sendError(res, 400, "Missing companyId.");
  if (!locationId) return sendError(res, 400, "Missing locationId.");
  if (!fileUrl)    return sendError(res, 400, "Missing fileUrl.");

  var fileBuffer;
  var contentType = "";
  try {
    var fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return sendError(res, 422, "Failed to download file: " + fileResponse.status + " " + fileResponse.statusText);
    }
    contentType = fileResponse.headers.get("content-type") || "";
    var arrayBuffer = await fileResponse.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } catch (err) {
    return sendError(res, 422, "Failed to fetch file from URL.", err.message);
  }

  var users;
  try {
    users = parseBuffer(fileBuffer, contentType, fileUrl);
  } catch (err) {
    return sendError(res, 422, "Failed to parse file.", err.message);
  }

  var results = [];
  var created = 0;
  var failed  = 0;
  var skipped = 0;

  for (var i = 0; i < users.length; i++) {
    var user = users[i];
    var rowNumber = user._rowIndex || (i + 2);

    if (user._missingFields && user._missingFields.length > 0) {
      skipped++;
      results.push({
        row: rowNumber,
        email: user.email || null,
        status: "skipped",
        error: "Missing required fields: " + user._missingFields.join(", "),
      });
      continue;
    }

    try {
      var data = await createUserCore({ companyId: companyId, locationId: locationId, user: user });
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
  }

  return sendResponse(res, 200, {
    success: true,
    locationId: locationId,
    total: users.length,
    created: created,
    failed: failed,
    skipped: skipped,
    results: results,
  });
};
